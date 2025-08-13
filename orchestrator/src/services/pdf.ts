import { Env } from '../env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PdfMetadata {
  pages: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  subject?: string;
  keywords?: string;
  creationDate?: Date;
  modificationDate?: Date;
  extractionMethod: 'pymupdf' | 'pdfminer';
  fileSize: number;
  processingTimeMs: number;
}

export interface PdfExtractionResult {
  text: string;
  metadata: PdfMetadata;
  warnings: string[];
}

export class PdfExtractionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: Record<string, any>
  ) {
    super(message);
    this.name = 'PdfExtractionError';
  }
}

async function spawnPythonProcess(
  command: string,
  args: string[],
  options: {
    timeout: number;
    cwd: string;
    env: NodeJS.ProcessEnv;
  }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Setup timeout
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      
      if (timedOut) {
        reject(new Error(`Process timed out after ${options.timeout}ms`));
      } else if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}, signal ${signal}. stderr: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function extractPdfViaBridge(
  filePath: string,
  timeoutSeconds: number = 30,
  maxPages?: number
): Promise<PdfExtractionResult> {
  
  const bridgePath = path.join(__dirname, '../../scripts/pdf-bridge/pdf_extractor.py');
  const pythonCommand = process.env.PDF_BRIDGE_PYTHON_PATH || 'python';
  
  const args = [
    bridgePath,
    '--input', filePath,
    '--output', 'json',
    '--timeout', timeoutSeconds.toString()
  ];

  if (maxPages) {
    args.push('--max-pages', maxPages.toString());
  }

  try {
    const result = await spawnPythonProcess(pythonCommand, args, {
      timeout: (timeoutSeconds + 5) * 1000, // Buffer 5s for Node.js timeout
      cwd: process.cwd(),
      env: process.env
    });

    let response;
    try {
      response = JSON.parse(result.stdout);
    } catch (parseError) {
      throw new PdfExtractionError(
        'OUTPUT_ENCODING_ERROR',
        'Invalid JSON response from PDF bridge',
        {
          stdout: result.stdout.substring(0, 1000),
          stderr: result.stderr.substring(0, 1000),
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        }
      );
    }

    if (!response.success) {
      throw new PdfExtractionError(
        response.error.code,
        response.error.message,
        response.error.details
      );
    }

    // Parse dates if present
    const metadata = { ...response.metadata };
    if (metadata.creation_date) {
      try {
        metadata.creationDate = new Date(metadata.creation_date);
        delete metadata.creation_date;
      } catch {
        // Ignore invalid dates
      }
    }
    if (metadata.modification_date) {
      try {
        metadata.modificationDate = new Date(metadata.modification_date);
        delete metadata.modification_date;
      } catch {
        // Ignore invalid dates
      }
    }

    return {
      text: response.text,
      metadata: metadata as PdfMetadata,
      warnings: response.warnings || []
    };

  } catch (error) {
    if (error instanceof PdfExtractionError) {
      throw error;
    }

    // Convert spawn/timeout errors to PDF extraction errors
    let code = 'EXTRACTION_FAILED';
    let message = 'PDF bridge execution failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        code = 'TIMEOUT_EXCEEDED';
        message = `PDF extraction timed out after ${timeoutSeconds} seconds`;
      } else if (error.message.includes('ENOENT')) {
        code = 'PYTHON_DEPS_MISSING';
        message = 'Python executable or PDF bridge script not found';
      }
    }

    throw new PdfExtractionError(code, message, {
      originalError: error instanceof Error ? error.message : String(error),
      filePath,
      timeout: timeoutSeconds,
      pythonCommand,
      bridgePath
    });
  }
}

export function createPdf(env: Env) {
  const bridgeEnabled = env.PDF_BRIDGE_ENABLED !== 'false';
  const defaultTimeout = parseInt(env.PDF_BRIDGE_TIMEOUT || '30', 10);
  const defaultMaxPages = parseInt(env.PDF_BRIDGE_MAX_PAGES || '1000', 10);

  return {
    async extractText(urlOrPath: string, options?: {
      timeout?: number;
      maxPages?: number;
    }): Promise<string> {
      if (!bridgeEnabled) {
        // Fallback to mock behavior for development
        return '';
      }

      try {
        const result = await this.extractTextWithMetadata(urlOrPath, options);
        return result.text;
      } catch (error) {
        // For backward compatibility, log error and return empty string
        // In production, you may want to throw the error instead
        console.error('PDF extraction failed:', error);
        return '';
      }
    },

    async extractTextWithMetadata(urlOrPath: string, options?: {
      timeout?: number;
      maxPages?: number;
    }): Promise<PdfExtractionResult> {
      if (!bridgeEnabled) {
        throw new PdfExtractionError(
          'PDF_BRIDGE_DISABLED',
          'PDF Bridge is disabled (PDF_BRIDGE_ENABLED=false)',
          { bridge_enabled: false }
        );
      }

      const timeout = options?.timeout || defaultTimeout;
      const maxPages = options?.maxPages || defaultMaxPages;

      // Convert file:// URLs to file paths if needed
      let filePath = urlOrPath;
      if (urlOrPath.startsWith('file://')) {
        // Remove file:// prefix and handle Windows paths
        filePath = urlOrPath.substring(7);
        // Handle forward slashes in Windows paths
        if (process.platform === 'win32') {
          filePath = filePath.replace(/\//g, '\\');
        }
      }

      return extractPdfViaBridge(filePath, timeout, maxPages);
    },

    async validatePdf(filePath: string): Promise<boolean> {
      if (!bridgeEnabled) {
        return false;
      }

      try {
        await this.extractTextWithMetadata(filePath, { timeout: 5, maxPages: 1 });
        return true;
      } catch (error) {
        return false;
      }
    },

    async getPdfInfo(filePath: string): Promise<PdfMetadata> {
      const result = await this.extractTextWithMetadata(filePath, { timeout: 10, maxPages: 1 });
      return result.metadata;
    }
  };
}

export type PdfClient = ReturnType<typeof createPdf>;

// Export de la fonction bridge pour les tests
export { extractPdfViaBridge };
