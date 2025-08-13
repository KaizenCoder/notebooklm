# PDF Bridge — Interface Schema & Protocol

**Complément à**: PDF_BRIDGE_SPECIFICATION.md  
**Version**: 1.0

---

## JSON Schema - Response Format

### Success Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "const": true
    },
    "text": {
      "type": "string",
      "description": "Extracted text content"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "pages": {
          "type": "integer",
          "minimum": 1
        },
        "title": {
          "type": ["string", "null"]
        },
        "author": {
          "type": ["string", "null"]
        },
        "creator": {
          "type": ["string", "null"]
        },
        "producer": {
          "type": ["string", "null"]
        },
        "subject": {
          "type": ["string", "null"]
        },
        "keywords": {
          "type": ["string", "null"]
        },
        "creation_date": {
          "type": ["string", "null"],
          "format": "date-time"
        },
        "modification_date": {
          "type": ["string", "null"],
          "format": "date-time"
        },
        "extraction_method": {
          "type": "string",
          "enum": ["pymupdf", "pdfminer"]
        },
        "file_size": {
          "type": "integer",
          "minimum": 0
        },
        "processing_time_ms": {
          "type": "integer",
          "minimum": 0
        }
      },
      "required": ["pages", "extraction_method", "file_size", "processing_time_ms"]
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "error": {
      "type": "null"
    }
  },
  "required": ["success", "text", "metadata", "warnings", "error"]
}
```

### Error Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "const": false
    },
    "text": {
      "type": "string",
      "const": ""
    },
    "metadata": {
      "type": "null"
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string",
          "enum": [
            "FILE_NOT_FOUND",
            "FILE_NOT_READABLE", 
            "INVALID_PDF",
            "FILE_TOO_LARGE",
            "TIMEOUT_EXCEEDED",
            "MEMORY_EXCEEDED",
            "CORRUPTED_PDF",
            "ENCRYPTED_PDF",
            "PYTHON_DEPS_MISSING",
            "EXTRACTION_FAILED",
            "OUTPUT_ENCODING_ERROR"
          ]
        },
        "message": {
          "type": "string"
        },
        "details": {
          "type": "object"
        }
      },
      "required": ["code", "message", "details"]
    }
  },
  "required": ["success", "text", "metadata", "warnings", "error"]
}
```

---

## CLI Command Specification

### Base Command
```
python pdf_extractor.py [OPTIONS]
```

### Options Schema
```yaml
options:
  - name: input
    short: -i
    long: --input
    type: path
    required: true
    description: "Absolute path to PDF file"
    validation: 
      - must_exist: true
      - extension: ".pdf"
      - readable: true
      
  - name: output
    short: -o  
    long: --output
    type: choice
    required: true
    choices: ["json", "text"]
    default: "json"
    description: "Output format"
    
  - name: timeout
    short: -t
    long: --timeout
    type: integer
    required: false
    default: 30
    min: 5
    max: 300
    description: "Timeout in seconds"
    
  - name: max-pages
    long: --max-pages
    type: integer
    required: false
    default: 1000
    min: 1
    max: 5000
    description: "Maximum pages to process"
    
  - name: encoding
    short: -e
    long: --encoding
    type: string
    required: false
    default: "utf-8"
    choices: ["utf-8", "utf-16", "latin-1"]
    description: "Output text encoding"
    
  - name: verbose
    short: -v
    long: --verbose
    type: boolean
    required: false
    default: false
    description: "Enable verbose logging"
    
  - name: help
    short: -h
    long: --help
    type: boolean
    description: "Show help message"
```

---

## Process Communication Protocol

### Node.js → Python
```typescript
// Spawn process with sanitized arguments
const args = [
  'pdf_extractor.py',
  '--input', validateAndSanitizePath(filePath),
  '--output', 'json',
  '--timeout', String(Math.max(5, Math.min(300, timeout))),
  '--max-pages', String(Math.max(1, Math.min(5000, maxPages)))
];

const child = spawn(pythonExecutable, args, {
  cwd: bridgeDirectory,
  env: process.env,
  timeout: (timeout + 5) * 1000,
  stdio: ['ignore', 'pipe', 'pipe']
});
```

### Python → Node.js
```python
# Success case - stdout
{
  "success": true,
  "text": "...",
  "metadata": {...},
  "warnings": [],
  "error": null
}

# Error case - stdout (not stderr)
{
  "success": false,
  "text": "",
  "metadata": null,
  "warnings": ["Warning message if any"],
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message", 
    "details": {...}
  }
}

# Exit codes
# 0: Success
# 1: Error (details in JSON output)
# 2: Invalid arguments
# 130: Interrupted (Ctrl+C)
# 143: Terminated (SIGTERM)
```

---

## Error Details Specification

### FILE_NOT_FOUND
```json
{
  "code": "FILE_NOT_FOUND",
  "message": "PDF file not found at specified path",
  "details": {
    "file_path": "/absolute/path/to/file.pdf",
    "resolved_path": "/resolved/path/to/file.pdf",
    "directory_exists": false
  }
}
```

### TIMEOUT_EXCEEDED  
```json
{
  "code": "TIMEOUT_EXCEEDED",
  "message": "PDF extraction timed out after 30 seconds",
  "details": {
    "file_path": "/path/to/file.pdf",
    "timeout_seconds": 30,
    "pages_processed": 15,
    "total_pages": 45,
    "extraction_method": "pymupdf"
  }
}
```

### INVALID_PDF
```json
{
  "code": "INVALID_PDF", 
  "message": "File is not a valid PDF document",
  "details": {
    "file_path": "/path/to/file.pdf",
    "file_size": 1024,
    "magic_bytes": "25504446",
    "mime_type": "application/octet-stream"
  }
}
```

---

## Performance Benchmarks

### Target Performance Matrix

| PDF Size | Pages | Expected Time | Max Time | Memory |
|----------|-------|---------------|----------|--------|
| < 1MB    | 1-5   | < 2s         | < 5s     | < 50MB |
| 1-10MB   | 5-50  | < 10s        | < 30s    | < 200MB|
| 10-50MB  | 50-200| < 30s        | < 60s    | < 500MB|
| > 50MB   | > 200 | Best effort  | TIMEOUT  | < 1GB  |

### Monitoring Metrics
```typescript
interface PdfExtractionMetrics {
  file_size: number;
  pages: number;
  processing_time_ms: number;
  memory_peak_mb: number;
  extraction_method: 'pymupdf' | 'pdfminer';
  success: boolean;
  error_code?: string;
}
```

---

## Integration Points

### Service Integration
```typescript
// orchestrator/src/services/pdf.ts
export interface PdfService {
  extractText(filePath: string, options?: {
    timeout?: number;
    maxPages?: number;
  }): Promise<PdfExtractionResult>;
  
  validatePdf(filePath: string): Promise<boolean>;
  getPdfInfo(filePath: string): Promise<PdfMetadata>;
}

export interface PdfExtractionResult {
  text: string;
  metadata: PdfMetadata;
  warnings: string[];
}

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
```

### Document Service Integration
```typescript
// orchestrator/src/services/document.ts
async function processDocument(source: DocumentSource): Promise<void> {
  let text: string;
  
  switch (source.type) {
    case 'pdf':
      const pdfResult = await pdf.extractText(source.filePath);
      text = pdfResult.text;
      // Merge PDF metadata into document metadata
      source.metadata = { ...source.metadata, ...pdfResult.metadata };
      break;
    // ... other cases
  }
  
  // Continue with existing chunking and embedding logic
  const chunks = chunkTokens(text);
  // ...
}
```

---

**Maintenu par**: team-02 (Ingestion)  
**Version**: 1.0  
**Dernière mise à jour**: 2025-08-13
