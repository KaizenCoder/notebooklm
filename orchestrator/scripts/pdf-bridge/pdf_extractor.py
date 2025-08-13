#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Bridge - Main CLI Script
Orchestrator PDF text extraction bridge

Usage:
    python pdf_extractor.py --input <file_path> --output json --timeout 30

Exit Codes:
    0: Success
    1: Error (see JSON output for details)
    2: Invalid arguments
    130: Interrupted (Ctrl+C)
    143: Terminated (SIGTERM)
"""

import sys
import os
import json
import argparse
import signal
from typing import Dict, Any

# Add extractors to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from extractors import PyMuPDFExtractor, PDFMinerExtractor
except ImportError as e:
    print(json.dumps({
        "success": False,
        "text": "",
        "metadata": None,
        "warnings": [],
        "error": {
            "code": "PYTHON_DEPS_MISSING",
            "message": f"Required Python packages not installed: {str(e)}",
            "details": {
                "missing_module": str(e),
                "install_command": "pip install -r requirements.txt"
            }
        }
    }))
    sys.exit(1)


class PDFBridgeCLI:
    """PDF Bridge Command Line Interface"""
    
    def __init__(self):
        self.interrupted = False
        self._setup_signal_handlers()
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            self.interrupted = True
            self._output_interrupted()
            sys.exit(130)
        
        signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, signal_handler)  # Termination
    
    def _output_interrupted(self):
        """Output interrupted response"""
        response = {
            "success": False,
            "text": "",
            "metadata": None,
            "warnings": [],
            "error": {
                "code": "INTERRUPTED",
                "message": "PDF extraction was interrupted",
                "details": {
                    "signal": "SIGINT or SIGTERM"
                }
            }
        }
        print(json.dumps(response))
    
    def parse_arguments(self) -> argparse.Namespace:
        """Parse command line arguments"""
        parser = argparse.ArgumentParser(
            description='PDF Bridge - Extract text from PDF files',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  python pdf_extractor.py --input /path/to/file.pdf --output json
  python pdf_extractor.py -i file.pdf -o text --timeout 60 --max-pages 100
  
Exit Codes:
  0: Success
  1: Error (details in output)
  2: Invalid arguments
            """
        )
        
        parser.add_argument(
            '--input', '-i',
            required=True,
            help='Absolute path to PDF file'
        )
        
        parser.add_argument(
            '--output', '-o',
            choices=['json', 'text'],
            default='json',
            help='Output format (default: json)'
        )
        
        parser.add_argument(
            '--timeout', '-t',
            type=int,
            default=30,
            metavar='SECONDS',
            help='Timeout in seconds (default: 30, min: 5, max: 300)'
        )
        
        parser.add_argument(
            '--max-pages',
            type=int,
            default=1000,
            metavar='PAGES',
            help='Maximum pages to process (default: 1000, min: 1, max: 5000)'
        )
        
        parser.add_argument(
            '--encoding', '-e',
            choices=['utf-8', 'utf-16', 'latin-1'],
            default='utf-8',
            help='Output text encoding (default: utf-8)'
        )
        
        parser.add_argument(
            '--verbose', '-v',
            action='store_true',
            help='Enable verbose logging to stderr'
        )
        
        return parser.parse_args()
    
    def validate_arguments(self, args: argparse.Namespace) -> Dict[str, Any]:
        """Validate parsed arguments"""
        errors = []
        
        # Validate input file
        if not os.path.isabs(args.input):
            errors.append("Input path must be absolute")
        
        if not args.input.lower().endswith('.pdf'):
            errors.append("Input file must have .pdf extension")
        
        if '..' in args.input:
            errors.append("Path traversal not allowed in input path")
        
        # Validate timeout
        if args.timeout < 5 or args.timeout > 300:
            errors.append("Timeout must be between 5 and 300 seconds")
        
        # Validate max pages
        if args.max_pages < 1 or args.max_pages > 5000:
            errors.append("Max pages must be between 1 and 5000")
        
        if errors:
            return {
                "success": False,
                "text": "",
                "metadata": None,
                "warnings": [],
                "error": {
                    "code": "INVALID_ARGUMENTS",
                    "message": "Invalid command line arguments",
                    "details": {
                        "errors": errors,
                        "provided_args": vars(args)
                    }
                }
            }
        
        return {"valid": True}
    
    def extract_with_fallback(self, file_path: str, timeout: int, max_pages: int, verbose: bool) -> Dict[str, Any]:
        """Extract PDF text with fallback strategy"""
        
        if verbose:
            print(f"Starting PDF extraction: {file_path}", file=sys.stderr)
            print(f"Parameters: timeout={timeout}s, max_pages={max_pages}", file=sys.stderr)
        
        # Try PyMuPDF first (primary method)
        try:
            if verbose:
                print("Attempting extraction with PyMuPDF...", file=sys.stderr)
            
            pymupdf_extractor = PyMuPDFExtractor(timeout, max_pages)
            result = pymupdf_extractor.extract(file_path)
            
            if result["success"]:
                if verbose:
                    print(f"PyMuPDF extraction successful: {len(result['text'])} characters", file=sys.stderr)
                return result
            else:
                if verbose:
                    print(f"PyMuPDF failed: {result['error']['code']}", file=sys.stderr)
                
                # Check if we should try fallback
                if self._should_try_fallback(result["error"]["code"]):
                    if verbose:
                        print("Attempting fallback to PDFMiner...", file=sys.stderr)
                else:
                    return result  # Return PyMuPDF error without fallback
        
        except Exception as e:
            if verbose:
                print(f"PyMuPDF exception: {str(e)}", file=sys.stderr)
        
        # Fallback to PDFMiner
        try:
            pdfminer_extractor = PDFMinerExtractor(timeout, max_pages)
            result = pdfminer_extractor.extract(file_path)
            
            if verbose:
                if result["success"]:
                    print(f"PDFMiner extraction successful: {len(result['text'])} characters", file=sys.stderr)
                else:
                    print(f"PDFMiner also failed: {result['error']['code']}", file=sys.stderr)
            
            return result
            
        except Exception as e:
            if verbose:
                print(f"PDFMiner exception: {str(e)}", file=sys.stderr)
            
            return {
                "success": False,
                "text": "",
                "metadata": None,
                "warnings": [],
                "error": {
                    "code": "EXTRACTION_FAILED",
                    "message": f"Both PyMuPDF and PDFMiner failed: {str(e)}",
                    "details": {
                        "file_path": file_path,
                        "fallback_attempted": True,
                        "final_error": str(e)
                    }
                }
            }
    
    def _should_try_fallback(self, error_code: str) -> bool:
        """Determine if fallback extraction should be attempted"""
        # Don't try fallback for these error types
        no_fallback_codes = [
            "FILE_NOT_FOUND",
            "FILE_NOT_READABLE",
            "ENCRYPTED_PDF",
            "TIMEOUT_EXCEEDED",
            "MEMORY_EXCEEDED"
        ]
        return error_code not in no_fallback_codes
    
    def format_output(self, result: Dict[str, Any], format_type: str, encoding: str) -> str:
        """Format output according to specified format"""
        
        if format_type == 'json':
            return json.dumps(result, ensure_ascii=False, indent=None, separators=(',', ':'))
        
        elif format_type == 'text':
            if result["success"]:
                return result["text"]
            else:
                # For text format, output error as plain text
                error_msg = f"ERROR: {result['error']['message']}"
                if result.get('warnings'):
                    error_msg += f"\nWarnings: {'; '.join(result['warnings'])}"
                return error_msg
        
        return ""
    
    def run(self) -> int:
        """Main execution method"""
        try:
            # Parse arguments
            args = self.parse_arguments()
            
            # Validate arguments
            validation = self.validate_arguments(args)
            if not validation.get("valid"):
                print(json.dumps(validation))
                return 2
            
            # Extract PDF
            result = self.extract_with_fallback(
                args.input,
                args.timeout,
                args.max_pages,
                args.verbose
            )
            
            # Format and output result
            formatted_output = self.format_output(result, args.output, args.encoding)
            
            # Encode output
            try:
                if args.encoding != 'utf-8':
                    formatted_output = formatted_output.encode(args.encoding, errors='replace').decode(args.encoding)
                print(formatted_output)
            except UnicodeEncodeError as e:
                error_response = {
                    "success": False,
                    "text": "",
                    "metadata": None,
                    "warnings": [],
                    "error": {
                        "code": "OUTPUT_ENCODING_ERROR",
                        "message": f"Cannot encode output to {args.encoding}",
                        "details": {
                            "encoding": args.encoding,
                            "error": str(e)
                        }
                    }
                }
                print(json.dumps(error_response))
                return 1
            
            # Return appropriate exit code
            return 0 if result["success"] else 1
            
        except KeyboardInterrupt:
            self._output_interrupted()
            return 130
            
        except Exception as e:
            # Unexpected error
            error_response = {
                "success": False,
                "text": "",
                "metadata": None,
                "warnings": [],
                "error": {
                    "code": "UNEXPECTED_ERROR",
                    "message": f"Unexpected error in PDF bridge: {str(e)}",
                    "details": {
                        "error_type": type(e).__name__,
                        "error_message": str(e)
                    }
                }
            }
            print(json.dumps(error_response))
            return 1


def main():
    """Main entry point"""
    cli = PDFBridgeCLI()
    exit_code = cli.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
