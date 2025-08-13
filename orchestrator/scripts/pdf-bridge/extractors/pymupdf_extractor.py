# -*- coding: utf-8 -*-
"""
PyMuPDF PDF Text Extractor
Primary extraction method for PDF Bridge
"""

import fitz  # PyMuPDF
import os
import time
from typing import Dict, Any, Optional
from datetime import datetime
from dateutil import parser as dateparser


class PyMuPDFExtractor:
    """Primary PDF text extractor using PyMuPDF"""
    
    def __init__(self, timeout_seconds: int = 30, max_pages: int = 1000):
        self.timeout_seconds = timeout_seconds
        self.max_pages = max_pages
        self.start_time = None
        
    def extract(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text and metadata from PDF using PyMuPDF
        
        Args:
            file_path: Absolute path to PDF file
            
        Returns:
            Dict with extracted text and metadata
        """
        self.start_time = time.time()
        
        try:
            # Validate file
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"PDF file not found: {file_path}")
                
            if not os.access(file_path, os.R_OK):
                raise PermissionError(f"Cannot read PDF file: {file_path}")
            
            file_size = os.path.getsize(file_path)
            
            # Open PDF document
            doc = fitz.open(file_path)
            
            if doc.is_encrypted:
                doc.close()
                raise ValueError("PDF is password protected")
            
            total_pages = len(doc)
            pages_to_process = min(total_pages, self.max_pages)
            
            # Extract text
            text_parts = []
            warnings = []
            
            for page_num in range(pages_to_process):
                # Check timeout
                if time.time() - self.start_time > self.timeout_seconds:
                    doc.close()
                    raise TimeoutError(f"Extraction timed out after {self.timeout_seconds} seconds")
                
                try:
                    page = doc[page_num]
                    page_text = page.get_text()
                    
                    if page_text.strip():
                        text_parts.append(page_text)
                    else:
                        warnings.append(f"Page {page_num + 1} contains no extractable text")
                        
                except Exception as e:
                    warnings.append(f"Error extracting page {page_num + 1}: {str(e)}")
                    continue
            
            # Combine all text
            full_text = "\n".join(text_parts)
            
            # Extract metadata
            metadata = self._extract_metadata(doc, file_size, pages_to_process)
            
            doc.close()
            
            return {
                "success": True,
                "text": full_text,
                "metadata": metadata,
                "warnings": warnings,
                "error": None
            }
            
        except FileNotFoundError as e:
            return self._error_response("FILE_NOT_FOUND", str(e), {
                "file_path": file_path,
                "directory_exists": os.path.exists(os.path.dirname(file_path))
            })
            
        except PermissionError as e:
            return self._error_response("FILE_NOT_READABLE", str(e), {
                "file_path": file_path
            })
            
        except ValueError as e:
            if "password protected" in str(e).lower():
                return self._error_response("ENCRYPTED_PDF", str(e), {
                    "file_path": file_path
                })
            else:
                return self._error_response("INVALID_PDF", str(e), {
                    "file_path": file_path
                })
                
        except TimeoutError as e:
            return self._error_response("TIMEOUT_EXCEEDED", str(e), {
                "file_path": file_path,
                "timeout_seconds": self.timeout_seconds,
                "pages_processed": len(text_parts) if 'text_parts' in locals() else 0,
                "total_pages": total_pages if 'total_pages' in locals() else None
            })
            
        except MemoryError as e:
            return self._error_response("MEMORY_EXCEEDED", "Insufficient memory for processing", {
                "file_path": file_path,
                "file_size": file_size if 'file_size' in locals() else None
            })
            
        except Exception as e:
            return self._error_response("EXTRACTION_FAILED", f"PyMuPDF extraction failed: {str(e)}", {
                "file_path": file_path,
                "error_type": type(e).__name__
            })
    
    def _extract_metadata(self, doc, file_size: int, pages_processed: int) -> Dict[str, Any]:
        """Extract metadata from PDF document"""
        
        metadata = doc.metadata
        processing_time = int((time.time() - self.start_time) * 1000)
        
        return {
            "pages": pages_processed,
            "title": metadata.get("title") or None,
            "author": metadata.get("author") or None,
            "creator": metadata.get("creator") or None,
            "producer": metadata.get("producer") or None,
            "subject": metadata.get("subject") or None,
            "keywords": metadata.get("keywords") or None,
            "creation_date": self._parse_pdf_date(metadata.get("creationDate")),
            "modification_date": self._parse_pdf_date(metadata.get("modDate")),
            "extraction_method": "pymupdf",
            "file_size_bytes": file_size,
            "processing_time_ms": processing_time
        }
    
    def _parse_pdf_date(self, pdf_date: Optional[str]) -> Optional[str]:
        """Parse PDF date format to ISO 8601"""
        if not pdf_date:
            return None
            
        try:
            # PDF date format: D:YYYYMMDDHHmmSSOHH'mm
            if pdf_date.startswith("D:"):
                pdf_date = pdf_date[2:]
            
            # Try different date parsing strategies
            try:
                parsed_date = dateparser.parse(pdf_date)
                if parsed_date:
                    return parsed_date.isoformat()
            except:
                pass
            
            # Fallback: try basic YYYYMMDD format
            if len(pdf_date) >= 8:
                try:
                    year = int(pdf_date[:4])
                    month = int(pdf_date[4:6])
                    day = int(pdf_date[6:8])
                    return datetime(year, month, day).isoformat()
                except:
                    pass
                    
            return None
            
        except Exception:
            return None
    
    def _error_response(self, code: str, message: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate standardized error response"""
        processing_time = int((time.time() - self.start_time) * 1000) if self.start_time else 0
        
        details["processing_time_ms"] = processing_time
        details["extraction_method"] = "pymupdf"
        
        return {
            "success": False,
            "text": "",
            "metadata": None,
            "warnings": [],
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
