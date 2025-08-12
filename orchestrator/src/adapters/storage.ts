/**
 * Storage Adapter for file operations
 * Implementation for Task 8.5: Storage Integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  hash: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface StorageUploadOptions {
  overwrite?: boolean;
  generateHash?: boolean;
  preserveOriginalName?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageListOptions {
  prefix?: string;
  limit?: number;
  offset?: number;
  includeMetadata?: boolean;
}

export class StorageAdapter {
  private basePath: string;
  private metadataPath: string;

  constructor(basePath = './storage') {
    this.basePath = path.resolve(basePath);
    this.metadataPath = path.join(this.basePath, '.metadata.json');
  }

  /**
   * Initialize storage directory and metadata
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
    
    // Create metadata file if it doesn't exist
    try {
      await fs.access(this.metadataPath);
    } catch {
      await fs.writeFile(this.metadataPath, JSON.stringify({}), 'utf-8');
    }
  }

  /**
   * Upload a file to storage
   */
  async upload(
    buffer: Buffer,
    filename: string,
    options: StorageUploadOptions = {}
  ): Promise<StorageFile> {
    await this.initialize();

    const fileId = this.generateFileId(filename);
    const finalFilename = options.preserveOriginalName ? filename : `${fileId}_${filename}`;
    const filePath = path.join(this.basePath, finalFilename);

    // Check if file exists and handle overwrite
    if (!options.overwrite) {
      try {
        await fs.access(filePath);
        throw new Error(`File ${finalFilename} already exists`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Write file
    await fs.writeFile(filePath, buffer);

    // Generate hash if requested
    const hash = options.generateHash ? this.generateHash(buffer) : '';

    // Get file stats
    const stats = await fs.stat(filePath);

    const file: StorageFile = {
      id: fileId,
      name: finalFilename,
      path: filePath,
      size: stats.size,
      mimeType: this.getMimeType(filename),
      hash,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };

    // Update metadata
    await this.updateMetadata(file, options.metadata);

    return file;
  }

  /**
   * Download a file from storage
   */
  async download(fileId: string): Promise<{ file: StorageFile; buffer: Buffer }> {
    const file = await this.getFile(fileId);
    const buffer = await fs.readFile(file.path);
    
    return { file, buffer };
  }

  /**
   * Get file information without downloading content
   */
  async getFile(fileId: string): Promise<StorageFile> {
    const metadata = await this.loadMetadata();
    const file = metadata[fileId];
    
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    // Verify file still exists
    try {
      await fs.access(file.path);
      return file;
    } catch {
      // File was deleted, remove from metadata
      delete metadata[fileId];
      await this.saveMetadata(metadata);
      throw new Error(`File with ID ${fileId} no longer exists`);
    }
  }

  /**
   * List files in storage
   */
  async list(options: StorageListOptions = {}): Promise<StorageFile[]> {
    const metadata = await this.loadMetadata();
    let files = Object.values(metadata) as StorageFile[];

    // Filter by prefix
    if (options.prefix) {
      files = files.filter(file => file.name.startsWith(options.prefix!));
    }

    // Sort by creation date (newest first)
    files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || files.length;
    
    return files.slice(offset, offset + limit);
  }

  /**
   * Delete a file from storage
   */
  async delete(fileId: string): Promise<void> {
    const file = await this.getFile(fileId);
    
    // Delete physical file
    await fs.unlink(file.path);

    // Remove from metadata
    const metadata = await this.loadMetadata();
    delete metadata[fileId];
    await this.saveMetadata(metadata);
  }

  /**
   * Check if storage is healthy
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      await fs.access(this.basePath);
      await fs.access(this.metadataPath);
      
      // Test write access
      const testFile = path.join(this.basePath, '.health_check');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    const files = await this.list();
    
    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null
      };
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const dates = files.map(file => file.createdAt);
    
    return {
      totalFiles: files.length,
      totalSize,
      oldestFile: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestFile: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  // Private helper methods
  private generateFileId(filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const nameHash = createHash('md5').update(filename).digest('hex').substring(0, 8);
    return `${timestamp}_${nameHash}_${random}`;
  }

  private generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async loadMetadata(): Promise<Record<string, StorageFile>> {
    try {
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Convert date strings back to Date objects
      Object.values(parsed).forEach((file: any) => {
        file.createdAt = new Date(file.createdAt);
        file.modifiedAt = new Date(file.modifiedAt);
      });
      
      return parsed;
    } catch {
      return {};
    }
  }

  private async saveMetadata(metadata: Record<string, StorageFile>): Promise<void> {
    await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  private async updateMetadata(file: StorageFile, customMetadata?: Record<string, any>): Promise<void> {
    const metadata = await this.loadMetadata();
    metadata[file.id] = {
      ...file,
      ...customMetadata
    };
    await this.saveMetadata(metadata);
  }
}

// Factory function for creating storage adapter
export function createStorageAdapter(basePath?: string): StorageAdapter {
  return new StorageAdapter(basePath);
}
