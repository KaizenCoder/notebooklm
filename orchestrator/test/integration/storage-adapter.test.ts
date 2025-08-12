/**
 * Integration tests for Storage adapter
 * Tests for Task 8.5: Storage Integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageAdapter, createStorageAdapter } from '../../src/adapters/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('StorageAdapter', () => {
  let adapter: StorageAdapter;
  const testStoragePath = './test-storage';

  beforeEach(async () => {
    adapter = new StorageAdapter(testStoragePath);
    await adapter.initialize();
  });

  afterEach(async () => {
    // Cleanup test storage directory
    try {
      await fs.rm(testStoragePath, { recursive: true, force: true });
    } catch {}
  });

  describe('upload and download', () => {
    it('should upload and download a file successfully', async () => {
      const content = 'Hello, World!';
      const buffer = Buffer.from(content, 'utf-8');
      const filename = 'test.txt';

      // Upload file
      const uploadedFile = await adapter.upload(buffer, filename, {
        generateHash: true
      });

      expect(uploadedFile.id).toBeDefined();
      expect(uploadedFile.name).toContain(filename);
      expect(uploadedFile.size).toBe(buffer.length);
      expect(uploadedFile.mimeType).toBe('text/plain');
      expect(uploadedFile.hash).toBeDefined();

      // Download file
      const { file, buffer: downloadedBuffer } = await adapter.download(uploadedFile.id);

      expect(file.id).toBe(uploadedFile.id);
      expect(downloadedBuffer.toString('utf-8')).toBe(content);
    });

    it('should preserve original filename when requested', async () => {
      const buffer = Buffer.from('test content');
      const filename = 'original-name.txt';

      const file = await adapter.upload(buffer, filename, {
        preserveOriginalName: true
      });

      expect(file.name).toBe(filename);
    });

    it('should reject duplicate uploads without overwrite', async () => {
      const buffer = Buffer.from('test content');
      const filename = 'duplicate.txt';

      await adapter.upload(buffer, filename, {
        preserveOriginalName: true
      });

      await expect(
        adapter.upload(buffer, filename, {
          preserveOriginalName: true,
          overwrite: false
        })
      ).rejects.toThrow('already exists');
    });

    it('should allow overwrite when specified', async () => {
      const buffer1 = Buffer.from('content 1');
      const buffer2 = Buffer.from('content 2');
      const filename = 'overwrite.txt';

      const file1 = await adapter.upload(buffer1, filename, {
        preserveOriginalName: true
      });

      // When overwriting with same filename, should reuse the same record but update content
      await adapter.upload(buffer2, filename, {
        preserveOriginalName: true,
        overwrite: true
      });

      // Should still be able to download the file (content should be updated)
      const { buffer: downloaded } = await adapter.download(file1.id);
      expect(downloaded.toString()).toBe('content 2');
    });
  });

  describe('file management', () => {
    it('should list files correctly', async () => {
      const files = [
        { name: 'file1.txt', content: 'content 1' },
        { name: 'file2.txt', content: 'content 2' },
        { name: 'other.md', content: '# Markdown' }
      ];

      const uploadedFiles: any[] = [];
      for (const file of files) {
        const uploaded = await adapter.upload(
          Buffer.from(file.content),
          file.name
        );
        uploadedFiles.push(uploaded);
      }

      // List all files
      const allFiles = await adapter.list();
      expect(allFiles).toHaveLength(3);

      // List with prefix filter - look for files that start with generated prefix
      const generatedFiles = allFiles.filter(f => f.name.includes('file'));
      expect(generatedFiles.length).toBeGreaterThanOrEqual(2);

      // List with pagination
      const limitedFiles = await adapter.list({ limit: 1 });
      expect(limitedFiles).toHaveLength(1);
    });

    it('should get file info without downloading', async () => {
      const buffer = Buffer.from('test content');
      const uploaded = await adapter.upload(buffer, 'info-test.txt');

      const fileInfo = await adapter.getFile(uploaded.id);

      expect(fileInfo.id).toBe(uploaded.id);
      expect(fileInfo.name).toBe(uploaded.name);
      expect(fileInfo.size).toBe(buffer.length);
    });

    it('should delete files correctly', async () => {
      const buffer = Buffer.from('delete me');
      const uploaded = await adapter.upload(buffer, 'delete.txt');

      // Verify file exists
      await expect(adapter.getFile(uploaded.id)).resolves.toBeDefined();

      // Delete file
      await adapter.delete(uploaded.id);

      // Verify file is gone
      await expect(adapter.getFile(uploaded.id)).rejects.toThrow('not found');
    });

    it('should handle missing files gracefully', async () => {
      await expect(
        adapter.getFile('nonexistent-id')
      ).rejects.toThrow('not found');

      await expect(
        adapter.download('nonexistent-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('statistics and health', () => {
    it('should return correct storage statistics', async () => {
      // Empty storage
      let stats = await adapter.getStats();
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestFile).toBeNull();
      expect(stats.newestFile).toBeNull();

      // Upload some files
      await adapter.upload(Buffer.from('small'), 'small.txt');
      await adapter.upload(Buffer.from('larger content'), 'large.txt');

      stats = await adapter.getStats();
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(5 + 14); // "small" + "larger content"
      expect(stats.oldestFile).toBeInstanceOf(Date);
      expect(stats.newestFile).toBeInstanceOf(Date);
    });

    it('should pass health check when storage is working', async () => {
      const health = await adapter.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toBeUndefined();
    });

    it('should detect unhealthy storage', async () => {
      // Create adapter with non-existent parent directory
      const badAdapter = new StorageAdapter('/non/existent/path/storage');

      const health = await badAdapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toBeDefined();
    });
  });

  describe('mime types', () => {
    it('should detect correct MIME types', async () => {
      const testCases = [
        { filename: 'test.txt', expectedMime: 'text/plain' },
        { filename: 'test.json', expectedMime: 'application/json' },
        { filename: 'test.pdf', expectedMime: 'application/pdf' },
        { filename: 'test.wav', expectedMime: 'audio/wav' },
        { filename: 'test.mp3', expectedMime: 'audio/mpeg' },
        { filename: 'test.unknown', expectedMime: 'application/octet-stream' }
      ];

      for (const testCase of testCases) {
        const file = await adapter.upload(
          Buffer.from('test'),
          testCase.filename
        );
        expect(file.mimeType).toBe(testCase.expectedMime);
      }
    });
  });

  describe('factory function', () => {
    it('should create adapter with default path', () => {
      const adapter = createStorageAdapter();
      expect(adapter).toBeInstanceOf(StorageAdapter);
    });

    it('should create adapter with custom path', () => {
      const adapter = createStorageAdapter('/custom/path');
      expect(adapter).toBeInstanceOf(StorageAdapter);
    });
  });
});
