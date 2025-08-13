#!/usr/bin/env python3
"""
Script principal de test pour le PDF Bridge (Tache 16.3)
Orchestre tous les types de tests : contractuels, performance, intégration
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
from typing import Dict, List, Any

# Configuration des chemins
SCRIPT_DIR = Path(__file__).parent
ORCHESTRATOR_ROOT = SCRIPT_DIR.parent
PDF_BRIDGE_DIR = ORCHESTRATOR_ROOT / "scripts" / "pdf-bridge"
CONTRACT_TESTS = SCRIPT_DIR / "contract" / "pdf-bridge" / "contract_tests.py"
FIXTURES_DIR = SCRIPT_DIR / "fixtures" / "pdf"

class PDFBridgeTestSuite:
    def __init__(self):
        self.results = {
            "timestamp": time.time(),
            "environment": self._get_environment_info(),
            "test_phases": {}
        }
    
    def _get_environment_info(self) -> Dict[str, Any]:
        """Collecte les informations d'environnement"""
        try:
            # Vérifier Python
            python_version = subprocess.check_output([sys.executable, "--version"], text=True).strip()
            
            # Vérifier les dépendances Python
            deps_check = subprocess.run([
                sys.executable, "-c", 
                "import PyMuPDF, pdfminer.six, dateutil; print('OK')"
            ], capture_output=True, text=True)
            
            return {
                "python_version": python_version,
                "python_executable": sys.executable,
                "dependencies_status": "OK" if deps_check.returncode == 0 else "MISSING",
                "pdf_bridge_dir": str(PDF_BRIDGE_DIR),
                "fixtures_available": self._check_fixtures()
            }
        except Exception as e:
            return {"error": str(e)}
    
    def _check_fixtures(self) -> Dict[str, bool]:
        """Vérifie la disponibilité des fixtures de test"""
        fixtures = {
            "simple.pdf": (FIXTURES_DIR / "simple.pdf").exists(),
            "empty.pdf": (FIXTURES_DIR / "empty.pdf").exists(),
            "corrupted.pdf": (FIXTURES_DIR / "corrupted.pdf").exists(),
            "large.pdf": (FIXTURES_DIR / "large.pdf").exists()
        }
        return fixtures
    
    def run_installation_validation(self) -> bool:
        """Phase 1: Validation de l'installation"""
        print("🔧 Phase 1: Validation de l'installation PDF Bridge")
        print("-" * 50)
        
        validator_script = PDF_BRIDGE_DIR / "install_validator.py"
        
        if not validator_script.exists():
            print(f"❌ Validateur d'installation non trouvé: {validator_script}")
            self.results["test_phases"]["installation"] = {
                "status": "FAILED",
                "error": "Validator script not found"
            }
            return False
        
        try:
            result = subprocess.run([
                sys.executable, str(validator_script)
            ], capture_output=True, text=True, timeout=30)
            
            success = result.returncode == 0
            
            self.results["test_phases"]["installation"] = {
                "status": "PASSED" if success else "FAILED",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
            
            if success:
                print("✅ Installation validée")
                return True
            else:
                print(f"❌ Installation échouée:")
                print(result.stderr)
                return False
                
        except subprocess.TimeoutExpired:
            print("❌ Timeout lors de la validation d'installation")
            self.results["test_phases"]["installation"] = {
                "status": "TIMEOUT",
                "error": "Installation validation timeout"
            }
            return False
        except Exception as e:
            print(f"❌ Erreur lors de la validation: {e}")
            self.results["test_phases"]["installation"] = {
                "status": "ERROR",
                "error": str(e)
            }
            return False
    
    def run_contract_tests(self) -> bool:
        """Phase 2: Tests contractuels"""
        print("\n🧪 Phase 2: Tests contractuels")
        print("-" * 50)
        
        if not CONTRACT_TESTS.exists():
            print(f"❌ Tests contractuels non trouvés: {CONTRACT_TESTS}")
            self.results["test_phases"]["contract"] = {
                "status": "FAILED",
                "error": "Contract tests script not found"
            }
            return False
        
        try:
            result = subprocess.run([
                sys.executable, str(CONTRACT_TESTS)
            ], capture_output=True, text=True, timeout=120)
            
            success = result.returncode == 0
            
            # Tenter de lire les résultats détaillés
            results_file = CONTRACT_TESTS.parent / "contract_test_results.json"
            detailed_results = None
            if results_file.exists():
                try:
                    with open(results_file) as f:
                        detailed_results = json.load(f)
                except:
                    pass
            
            self.results["test_phases"]["contract"] = {
                "status": "PASSED" if success else "FAILED",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "detailed_results": detailed_results
            }
            
            if success:
                print("✅ Tests contractuels réussis")
                if detailed_results:
                    passed = detailed_results.get("passed", 0)
                    failed = detailed_results.get("failed", 0)
                    print(f"   📊 {passed} réussis, {failed} échoués")
                return True
            else:
                print("❌ Tests contractuels échoués:")
                print(result.stdout)
                if result.stderr:
                    print("Erreurs:")
                    print(result.stderr)
                return False
                
        except subprocess.TimeoutExpired:
            print("❌ Timeout lors des tests contractuels")
            self.results["test_phases"]["contract"] = {
                "status": "TIMEOUT",
                "error": "Contract tests timeout"
            }
            return False
        except Exception as e:
            print(f"❌ Erreur lors des tests contractuels: {e}")
            self.results["test_phases"]["contract"] = {
                "status": "ERROR",
                "error": str(e)
            }
            return False
    
    def run_performance_tests(self) -> bool:
        """Phase 3: Tests de performance"""
        print("\n⚡ Phase 3: Tests de performance")
        print("-" * 50)
        
        pdf_extractor = PDF_BRIDGE_DIR / "pdf_extractor.py"
        simple_pdf = FIXTURES_DIR / "simple.pdf"
        
        if not simple_pdf.exists():
            print("⚠️  Fixture simple.pdf non disponible, skippé")
            self.results["test_phases"]["performance"] = {
                "status": "SKIPPED",
                "reason": "Missing simple.pdf fixture"
            }
            return True
        
        try:
            # Test 1: Temps d'extraction simple
            start_time = time.time()
            result = subprocess.run([
                sys.executable, str(pdf_extractor),
                "--input", str(simple_pdf),
                "--output", "json",
                "--verbose"
            ], capture_output=True, text=True, timeout=30)
            end_time = time.time()
            
            if result.returncode == 0:
                try:
                    output_data = json.loads(result.stdout)
                    processing_time = output_data.get("metadata", {}).get("processing_time_ms", 0)
                    total_time_ms = (end_time - start_time) * 1000
                    
                    print(f"✅ Extraction simple: {processing_time}ms (total: {total_time_ms:.1f}ms)")
                    
                    # Critères de performance
                    performance_ok = processing_time < 5000  # Moins de 5 secondes
                    
                    self.results["test_phases"]["performance"] = {
                        "status": "PASSED" if performance_ok else "WARNING",
                        "metrics": {
                            "processing_time_ms": processing_time,
                            "total_time_ms": total_time_ms,
                            "performance_threshold": 5000,
                            "performance_ok": performance_ok
                        }
                    }
                    
                    return True
                    
                except json.JSONDecodeError:
                    print("❌ Sortie JSON invalide lors du test de performance")
                    self.results["test_phases"]["performance"] = {
                        "status": "FAILED",
                        "error": "Invalid JSON output"
                    }
                    return False
            else:
                print(f"❌ Échec de l'extraction: {result.stderr}")
                self.results["test_phases"]["performance"] = {
                    "status": "FAILED",
                    "error": result.stderr
                }
                return False
                
        except subprocess.TimeoutExpired:
            print("❌ Timeout lors des tests de performance")
            self.results["test_phases"]["performance"] = {
                "status": "TIMEOUT",
                "error": "Performance tests timeout"
            }
            return False
        except Exception as e:
            print(f"❌ Erreur lors des tests de performance: {e}")
            self.results["test_phases"]["performance"] = {
                "status": "ERROR",
                "error": str(e)
            }
            return False
    
    def run_integration_smoke_tests(self) -> bool:
        """Phase 4: Tests d'intégration smoke (simulation Node.js)"""
        print("\n🔗 Phase 4: Tests d'intégration smoke")
        print("-" * 50)
        
        # Simuler les appels que ferait le service Node.js
        pdf_extractor = PDF_BRIDGE_DIR / "pdf_extractor.py"
        test_cases = [
            {
                "name": "SUCCESS_CASE",
                "file": "simple.pdf",
                "expected_success": True
            },
            {
                "name": "FILE_NOT_FOUND",
                "file": "nonexistent.pdf",
                "expected_success": False
            },
            {
                "name": "CORRUPTED_FILE",
                "file": "corrupted.pdf",
                "expected_success": False
            }
        ]
        
        results = []
        all_passed = True
        
        for test_case in test_cases:
            test_file = FIXTURES_DIR / test_case["file"]
            
            try:
                result = subprocess.run([
                    sys.executable, str(pdf_extractor),
                    "--input", str(test_file),
                    "--output", "json"
                ], capture_output=True, text=True, timeout=30)
                
                # Parser la réponse JSON
                try:
                    output_data = json.loads(result.stdout)
                    actual_success = output_data.get("success", False)
                    
                    test_passed = actual_success == test_case["expected_success"]
                    
                    if test_passed:
                        print(f"✅ {test_case['name']}")
                    else:
                        print(f"❌ {test_case['name']} - Expected {test_case['expected_success']}, got {actual_success}")
                        all_passed = False
                    
                    results.append({
                        "test": test_case["name"],
                        "passed": test_passed,
                        "expected_success": test_case["expected_success"],
                        "actual_success": actual_success,
                        "response": output_data
                    })
                    
                except json.JSONDecodeError:
                    print(f"❌ {test_case['name']} - Invalid JSON response")
                    all_passed = False
                    results.append({
                        "test": test_case["name"],
                        "passed": False,
                        "error": "Invalid JSON response",
                        "raw_stdout": result.stdout
                    })
                
            except subprocess.TimeoutExpired:
                print(f"❌ {test_case['name']} - Timeout")
                all_passed = False
                results.append({
                    "test": test_case["name"],
                    "passed": False,
                    "error": "Timeout"
                })
            except Exception as e:
                print(f"❌ {test_case['name']} - Error: {e}")
                all_passed = False
                results.append({
                    "test": test_case["name"],
                    "passed": False,
                    "error": str(e)
                })
        
        self.results["test_phases"]["integration"] = {
            "status": "PASSED" if all_passed else "FAILED",
            "test_results": results
        }
        
        return all_passed
    
    def generate_report(self) -> str:
        """Génère un rapport de test complet"""
        report_file = SCRIPT_DIR / f"test_report_{int(time.time())}.json"
        
        # Calculer le statut global
        phases = self.results["test_phases"]
        all_passed = all(
            phase.get("status") in ["PASSED", "SKIPPED"] 
            for phase in phases.values()
        )
        
        self.results["overall_status"] = "PASSED" if all_passed else "FAILED"
        self.results["summary"] = {
            "total_phases": len(phases),
            "passed_phases": sum(1 for p in phases.values() if p.get("status") == "PASSED"),
            "failed_phases": sum(1 for p in phases.values() if p.get("status") == "FAILED"),
            "skipped_phases": sum(1 for p in phases.values() if p.get("status") == "SKIPPED")
        }
        
        # Sauvegarder le rapport
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        return str(report_file)
    
    def run_all_tests(self) -> bool:
        """Execute toute la suite de tests"""
        print("🚀 Démarrage de la suite de tests PDF Bridge (Tâche 16.3)")
        print("=" * 70)
        
        # Phase 1: Installation
        if not self.run_installation_validation():
            print("\n❌ ÉCHEC: Installation non validée")
            return False
        
        # Phase 2: Contrats
        if not self.run_contract_tests():
            print("\n❌ ÉCHEC: Tests contractuels échoués")
            # On continue quand même pour avoir un rapport complet
        
        # Phase 3: Performance
        self.run_performance_tests()
        
        # Phase 4: Intégration
        self.run_integration_smoke_tests()
        
        # Génération du rapport
        report_file = self.generate_report()
        
        # Résumé final
        print("\n" + "=" * 70)
        phases = self.results["test_phases"]
        summary = self.results["summary"]
        
        print(f"📊 RÉSUMÉ: {summary['passed_phases']}/{summary['total_phases']} phases réussies")
        for phase_name, phase_data in phases.items():
            status_emoji = {
                "PASSED": "✅",
                "FAILED": "❌", 
                "SKIPPED": "⏩",
                "WARNING": "⚠️",
                "TIMEOUT": "⏰",
                "ERROR": "💥"
            }.get(phase_data.get("status"), "❓")
            
            print(f"  {status_emoji} {phase_name.upper()}: {phase_data.get('status')}")
        
        print(f"\n📄 Rapport détaillé: {report_file}")
        
        overall_success = self.results["overall_status"] == "PASSED"
        if overall_success:
            print("🎉 SUCCÈS: Tous les tests PDF Bridge sont réussis!")
        else:
            print("⚠️  ATTENTION: Certains tests ont échoué - Voir détails ci-dessus")
        
        return overall_success

if __name__ == "__main__":
    suite = PDFBridgeTestSuite()
    success = suite.run_all_tests()
    sys.exit(0 if success else 1)
