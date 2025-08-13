# -*- coding: utf-8 -*-
"""
PDFMiner PDF Text Extractor
Fallback extraction method for PDF Bridge
"""

import os
import time
import io
from typing import Dict, Any, Optional
from pdfminer.high_level import extract_text
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument, PDFEncryptionError
import signal


class TimeoutHandler:
    """Timeout handler for PDFMiner operations"""
    def __init__(self, timeout_seconds: int):
        self.timeout_seconds = timeout_seconds
        
    def __enter__(self):
        def timeout_handler(signum, frame):
            raise TimeoutError(f"PDFMiner extraction timed out after {self.timeout_seconds} seconds")
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(self.timeout_seconds)
        return self
        
    def __exit__(self, type, value, traceback):
        signal.alarm(0)


class PDFMinerExtractor:
    """Fallback PDF text extractor using PDFMiner"""
    
    def __init__(self, timeout_seconds: int = 30, max_pages: int = 1000):
        self.timeout_seconds = timeout_seconds
        self.max_pages = max_pages
        self.start_time = None
        
    def extract(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from PDF using PDFMiner
        
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
            
            # Open and validate PDF
            with open(file_path, 'rb') as file:
                parser = PDFParser(file)
                try:
                    document = PDFDocument(parser)
                except PDFEncryptionError:
                    raise ValueError("PDF is password protected")
                
                if not document.is_extractable:
                    raise ValueError("PDF text extraction is not allowed")
                
                # Count total pages
                total_pages = sum(1 for _ in PDFPage.create_pages(document))
                pages_to_process = min(total_pages, self.max_pages)
                
                # Extract text with timeout
                try:
                    if os.name != 'nt':  # Unix/Linux/Mac
                        with TimeoutHandler(self.timeout_seconds):
                            text = self._extract_text_controlled(file_path, pages_to_process)
                    else:  # Windows - no signal support
                        text = self._extract_text_controlled(file_path, pages_to_process)
                        
                        # Manual timeout check
                        if time.time() - self.start_time > self.timeout_seconds:
                            raise TimeoutError(f"Extraction timed out after {self.timeout_seconds} seconds")
                
                except TimeoutError:
                    raise
                
                # Build metadata
                metadata = self._build_metadata(document, file_size, pages_to_process, total_pages)
                
                warnings = []
                if pages_to_process < total_pages:
                    warnings.append(f"Processed only {pages_to_process} of {total_pages} pages due to max_pages limit")
                
                if not text.strip():
                    warnings.append("No extractable text found in PDF")
                
                return {
                    "success": True,
                    "text": text,
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
            if "password protected" in str(e).lower() or "encryption" in str(e).lower():
                return self._error_response("ENCRYPTED_PDF", str(e), {
                    "file_path": file_path
                })
            elif "not allowed" in str(e).lower():
                return self._error_response("INVALID_PDF", f"PDF extraction restricted: {str(e)}", {
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
                "total_pages": total_pages if 'total_pages' in locals() else None
            })
            
        except MemoryError as e:
            return self._error_response("MEMORY_EXCEEDED", "Insufficient memory for processing", {
                "file_path": file_path,
                "file_size": file_size if 'file_size' in locals() else None
            })
            
        except Exception as e:
            return self._error_response("EXTRACTION_FAILED", f"PDFMiner extraction failed: {str(e)}", {
                "file_path": file_path,
                "error_type": type(e).__name__
            })
    
    def _extract_text_controlled(self, file_path: str, max_pages: int) -> str:
        """Extract text with controlled pagination"""
        output_string = io.StringIO()
        
        with open(file_path, 'rb') as file:
            parser = PDFParser(file)
            document = PDFDocument(parser)
            rsrcmgr = PDFResourceManager()
            
            laparams = LAParams(
                boxes_flow=0.5,
                word_margin=0.1,
                char_margin=2.0,
                line_margin=0.5
            )
            
            converter = TextConverter(rsrcmgr, output_string, laparams=laparams)
            interpreter = PDFPageInterpreter(rsrcmgr, converter)
            
            page_count = 0
            for page in PDFPage.create_pages(document):
                if page_count >= max_pages:
                    break
                    
                # Check timeout periodically 
                if page_count % 10 == 0:
                    if time.time() - self.start_time > self.timeout_seconds:
                        break
                        
                interpreter.process_page(page)
                page_count += 1
            
            converter.close()
            
        text = output_string.getvalue()
        output_string.close()
        
        return text
    
    def _build_metadata(self, document, file_size: int, pages_processed: int, total_pages: int) -> Dict[str, Any]:
        """Build metadata from PDFMiner document info"""
        
        processing_time = int((time.time() - self.start_time) * 1000)
        
        # Extract document info
        info = document.info[0] if document.info else {}
        
        return {
            "pages": pages_processed,
            "total_pages": total_pages,
            "title": self._decode_pdf_string(info.get("Title")),
            "author": self._decode_pdf_string(info.get("Author")),
            "creator": self._decode_pdf_string(info.get("Creator")),
            "producer": self._decode_pdf_string(info.get("Producer")),
            "subject": self._decode_pdf_string(info.get("Subject")),
            "keywords": self._decode_pdf_string(info.get("Keywords")),
            "creation_date": self._parse_pdf_date(info.get("CreationDate")),
            "modification_date": self._parse_pdf_date(info.get("ModDate")),
            "extraction_method": "pdfminer",
            "file_size_bytes": file_size,
            "processing_time_ms": processing_time
        }
    
    def _decode_pdf_string(self, pdf_obj) -> Optional[str]:
        """Decode PDF string object to Python string"""
        if pdf_obj is None:
            return None
            
        try:
            if hasattr(pdf_obj, 'resolve'):
                pdf_obj = pdf_obj.resolve()
                
            if hasattr(pdf_obj, 'decode'):
                return pdf_obj.decode('utf-8', errors='ignore')
            elif isinstance(pdf_obj, bytes):
                return pdf_obj.decode('utf-8', errors='ignore')
            elif isinstance(pdf_obj, str):
                return pdf_obj
            else:
                return str(pdf_obj)
                
        except Exception:
            return None
    
    def _parse_pdf_date(self, pdf_date_obj) -> Optional[str]:
        """Parse PDF date object to ISO 8601 string"""
        if pdf_date_obj is None:
            return None
            
        try:
            date_str = self._decode_pdf_string(pdf_date_obj)
            if not date_str:
                return None
            
            # PDF date format: D:YYYYMMDDHHmmSSOHH'mm
            if date_str.startswith("D:"):
                date_str = date_str[2:]
            
            # Basic parsing YYYYMMDDHHMMSS
            if len(date_str) >= 14:
                year = int(date_str[:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                hour = int(date_str[8:10])
                minute = int(date_str[10:12])
                second = int(date_str[12:14])
                
                from datetime import datetime
                dt = datetime(year, month, day, hour, minute, second)
                return dt.isoformat()
            elif len(date_str) >= 8:
                year = int(date_str[:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                
                from datetime import datetime
                dt = datetime(year, month, day)
                return dt.isoformat()
                
            return None
            
        except Exception:
            return None
    
    def _error_response(self, code: str, message: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate standardized error response"""
        processing_time = int((time.time() - self.start_time) * 1000) if self.start_time else 0
        
        details["processing_time_ms"] = processing_time
        details["extraction_method"] = "pdfminer"
        
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
