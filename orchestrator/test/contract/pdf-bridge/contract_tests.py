#!/usr/bin/env python3
"""
Tests contractuels pour le PDF Bridge
Valide tous les cas d'erreur et de succès définis dans la spécification
"""

import os
import sys
import json
import subprocess
import time
import signal
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional

# Chemin vers le script PDF extractor
SCRIPT_DIR = Path(__file__).parent
PDF_BRIDGE_DIR = SCRIPT_DIR.parent.parent.parent / "scripts" / "pdf-bridge"
PDF_EXTRACTOR = PDF_BRIDGE_DIR / "pdf_extractor.py"
FIXTURES_DIR = SCRIPT_DIR.parent.parent / "fixtures" / "pdf"

def run_pdf_extractor(args: list, timeout: int = 30) -> Dict[str, Any]:
    """Execute le PDF extractor avec les arguments donnés"""
    cmd = [sys.executable, str(PDF_EXTRACTOR)] + args
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        # Tenter de parser la sortie JSON
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "INVALID_JSON_OUTPUT",
                "raw_stdout": result.stdout,
                "raw_stderr": result.stderr,
                "return_code": result.returncode
            }
            
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "TIMEOUT_EXCEEDED",
            "message": f"Process exceeded {timeout}s timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "error": "EXECUTION_ERROR",
            "message": str(e)
        }

class PDFBridgeContractTest:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def assert_test(self, condition: bool, test_name: str, message: str = ""):
        """Assertion de test avec comptage"""
        if condition:
            self.passed += 1
            print(f"✅ {test_name}")
            self.results.append({"test": test_name, "status": "PASS", "message": message})
        else:
            self.failed += 1
            print(f"❌ {test_name}: {message}")
            self.results.append({"test": test_name, "status": "FAIL", "message": message})
    
    def test_success_simple_extraction(self):
        """Test extraction réussie avec PDF simple"""
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        result = run_pdf_extractor(["--input", str(simple_pdf), "--output", "json"])
        
        self.assert_test(
            result.get("success") is True,
            "SUCCESS_SIMPLE_EXTRACTION",
            f"Expected success=true, got: {result.get('success')}"
        )
        
        self.assert_test(
            "Simple PDF for contract testing" in result.get("text", ""),
            "SUCCESS_SIMPLE_EXTRACTION_CONTENT",
            f"Expected text content, got: {result.get('text', '')[:100]}..."
        )
        
        self.assert_test(
            result.get("metadata", {}).get("pages") == 1,
            "SUCCESS_SIMPLE_EXTRACTION_METADATA",
            f"Expected 1 page, got: {result.get('metadata', {}).get('pages')}"
        )
    
    def test_error_file_not_found(self):
        """Test erreur FILE_NOT_FOUND"""
        nonexistent_pdf = FIXTURES_DIR / "nonexistent.pdf"
        result = run_pdf_extractor(["--input", str(nonexistent_pdf), "--output", "json"])
        
        self.assert_test(
            result.get("success") is False,
            "ERROR_FILE_NOT_FOUND_SUCCESS",
            f"Expected success=false, got: {result.get('success')}"
        )
        
        self.assert_test(
            (result.get("error") or {}).get("code") == "FILE_NOT_FOUND",
            "ERROR_FILE_NOT_FOUND_CODE",
            f"Expected FILE_NOT_FOUND, got: {(result.get('error') or {}).get('code')}"
        )
    
    def test_error_corrupted_file(self):
        """Test erreur CORRUPTED_FILE"""
        corrupted_pdf = FIXTURES_DIR / "corrupted.pdf"
        result = run_pdf_extractor(["--input", str(corrupted_pdf), "--output", "json"])
        
        self.assert_test(
            result.get("success") is False,
            "ERROR_CORRUPTED_FILE_SUCCESS",
            f"Expected success=false, got: {result.get('success')}"
        )
        
        expected_errors = ["CORRUPTED_FILE", "EXTRACTION_FAILED"]
        self.assert_test(
            (result.get("error") or {}).get("code") in expected_errors,
            "ERROR_CORRUPTED_FILE_CODE",
            f"Expected one of {expected_errors}, got: {(result.get('error') or {}).get('code')}"
        )
    
    def test_empty_pdf_handling(self):
        """Test PDF vide (succès avec texte vide)"""
        empty_pdf = FIXTURES_DIR / "empty.pdf"
        result = run_pdf_extractor(["--input", str(empty_pdf), "--output", "json"])
        
        self.assert_test(
            result.get("success") is True,
            "EMPTY_PDF_SUCCESS",
            f"Expected success=true for empty PDF, got: {result.get('success')}"
        )
        
        self.assert_test(
            result.get("text", "").strip() == "",
            "EMPTY_PDF_NO_TEXT",
            f"Expected empty text, got: '{result.get('text', '')}'"
        )
    
    def test_invalid_arguments(self):
        """Test erreurs d'arguments invalides"""
        # Test sans --input
        result = run_pdf_extractor(["--output", "json"])
        
        self.assert_test(
            result.get("success") is False,
            "INVALID_ARGS_NO_INPUT",
            f"Expected failure without --input, got success: {result.get('success')}"
        )
        
        # Test format de sortie invalide
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        result = run_pdf_extractor(["--input", str(simple_pdf), "--output", "invalid"])
        
        self.assert_test(
            result.get("success") is False,
            "INVALID_ARGS_OUTPUT_FORMAT",
            f"Expected failure with invalid output format, got success: {result.get('success')}"
        )
    
    def test_timeout_handling(self):
        """Test gestion des timeouts"""
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        # Test avec timeout très court (5 secondes - minimum autorisé)
        result = run_pdf_extractor(["--input", str(simple_pdf), "--output", "json", "--timeout", "5"], timeout=10)
        
        # Le PDF simple devrait s'extraire même avec 5s de timeout
        # Si le timeout est trop agressif, on pourrait avoir TIMEOUT_EXCEEDED
        is_success = result.get("success") is True
        error_obj = result.get("error") or {}
        is_timeout = error_obj.get("code") == "TIMEOUT_EXCEEDED"
        
        self.assert_test(
            is_success or is_timeout,
            "TIMEOUT_HANDLING",
            f"Expected success or TIMEOUT_EXCEEDED, got: {error_obj.get('code', 'SUCCESS')}"
        )
    
    def test_verbose_output(self):
        """Test mode verbose"""
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        result = run_pdf_extractor(["--input", str(simple_pdf), "--output", "json", "--verbose"])
        
        self.assert_test(
            result.get("success") is True,
            "VERBOSE_MODE_SUCCESS",
            f"Verbose mode should work, got success: {result.get('success')}"
        )
        
        # En mode verbose, on devrait avoir des métadonnées détaillées
        metadata = result.get("metadata", {})
        self.assert_test(
            "processing_time_ms" in metadata,
            "VERBOSE_MODE_METADATA",
            f"Expected processing_time_ms in metadata, got keys: {list(metadata.keys())}"
        )
    
    def test_json_schema_compliance(self):
        """Test conformité du schéma JSON"""
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        result = run_pdf_extractor(["--input", str(simple_pdf), "--output", "json"])
        
        # Test structure de succès
        required_success_fields = ["success", "text", "metadata"]
        for field in required_success_fields:
            self.assert_test(
                field in result,
                f"JSON_SCHEMA_SUCCESS_{field.upper()}",
                f"Missing required field: {field}"
            )
        
        # Test métadonnées
        metadata = result.get("metadata", {})
        required_metadata_fields = ["pages", "file_size_bytes", "extraction_method"]
        for field in required_metadata_fields:
            self.assert_test(
                field in metadata,
                f"JSON_SCHEMA_METADATA_{field.upper()}",
                f"Missing metadata field: {field}"
            )
    
    def run_all_tests(self):
        """Execute tous les tests contractuels"""
        print("🧪 Démarrage des tests contractuels PDF Bridge")
        print("=" * 60)
        
        # Vérifier que les fixtures existent
        print("📋 Vérification des fixtures...")
        required_fixtures = ["simple.pdf", "empty.pdf", "corrupted.pdf"]
        for fixture in required_fixtures:
            fixture_path = FIXTURES_DIR / fixture
            if fixture_path.exists():
                print(f"✅ {fixture}")
            else:
                print(f"❌ {fixture} - MANQUANT")
                return False
        
        print("\n🎯 Tests contractuels:")
        print("-" * 40)
        
        # Executer tous les tests
        self.test_success_simple_extraction()
        self.test_error_file_not_found()
        self.test_error_corrupted_file()
        self.test_empty_pdf_handling()
        self.test_invalid_arguments()
        self.test_timeout_handling()
        self.test_verbose_output()
        self.test_json_schema_compliance()
        
        # Résumé
        print("\n" + "=" * 60)
        print(f"📊 Résultats: {self.passed} réussis, {self.failed} échoués")
        
        if self.failed == 0:
            print("🎉 TOUS LES TESTS CONTRACTUELS RÉUSSIS!")
            return True
        else:
            print("⚠️  ÉCHECS DÉTECTÉS - Voir détails ci-dessus")
            return False

if __name__ == "__main__":
    tester = PDFBridgeContractTest()
    success = tester.run_all_tests()
    
    # Sauvegarder les résultats
    results_file = Path(__file__).parent / "contract_test_results.json"
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": time.time(),
            "passed": tester.passed,
            "failed": tester.failed,
            "results": tester.results
        }, f, indent=2)
    
    print(f"\n📄 Résultats sauvegardés: {results_file}")
    sys.exit(0 if success else 1)
