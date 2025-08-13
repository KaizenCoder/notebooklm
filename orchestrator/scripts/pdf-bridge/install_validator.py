#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Bridge Installation Validator
Checks dependencies and installation status
"""

import sys
import subprocess
import os
import json
from pathlib import Path


def check_python_version():
    """Check if Python version is adequate"""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    else:
        print("✅ Python version adequate")
        return True


def check_dependencies():
    """Check if required packages are installed"""
    dependencies = [
        ('fitz', 'PyMuPDF'),
        ('pdfminer', 'pdfminer.six'),
        ('dateutil', 'python-dateutil')
    ]
    
    missing = []
    
    for module_name, package_name in dependencies:
        try:
            __import__(module_name)
            print(f"✅ {package_name}: installed")
        except ImportError:
            print(f"❌ {package_name}: missing")
            missing.append(package_name)
    
    return missing


def check_extractors():
    """Check if extractor modules work"""
    try:
        from extractors import PyMuPDFExtractor, PDFMinerExtractor
        print("✅ Extractor modules: importable")
        
        # Test basic instantiation
        pymupdf_extractor = PyMuPDFExtractor()
        pdfminer_extractor = PDFMinerExtractor()
        print("✅ Extractor classes: instantiable")
        
        return True
        
    except Exception as e:
        print(f"❌ Extractor modules: {e}")
        return False


def test_cli_interface():
    """Test CLI interface"""
    try:
        script_path = Path(__file__).parent / "pdf_extractor.py"
        result = subprocess.run([
            sys.executable, str(script_path), "--help"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0 and "PDF Bridge" in result.stdout:
            print("✅ CLI interface: working")
            return True
        else:
            print(f"❌ CLI interface: failed (exit code {result.returncode})")
            print("stdout:", result.stdout[:200])
            print("stderr:", result.stderr[:200])
            return False
            
    except Exception as e:
        print(f"❌ CLI interface: {e}")
        return False


def install_dependencies():
    """Install missing dependencies"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    try:
        print("📦 Installing dependencies...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print("❌ Failed to install dependencies")
            print("stdout:", result.stdout[-500:])
            print("stderr:", result.stderr[-500:])
            return False
            
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False


def create_installation_report():
    """Create installation status report"""
    report = {
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "python_executable": sys.executable,
        "bridge_path": str(Path(__file__).parent),
        "timestamp": subprocess.run(['date', '-u', '+%Y-%m-%dT%H:%M:%SZ'], 
                                  capture_output=True, text=True).stdout.strip(),
        "checks": {}
    }
    
    # Run all checks
    report["checks"]["python_version"] = check_python_version()
    
    missing_deps = check_dependencies()
    report["checks"]["dependencies"] = len(missing_deps) == 0
    report["missing_dependencies"] = missing_deps
    
    report["checks"]["extractors"] = check_extractors()
    report["checks"]["cli_interface"] = test_cli_interface()
    
    # Overall status
    report["installation_valid"] = all(report["checks"].values())
    
    return report


def main():
    """Main installation validation"""
    print("🔧 PDF Bridge Installation Validator\n")
    
    # Check Python version first
    if not check_python_version():
        print("\n❌ Python version too old. Please upgrade to Python 3.8+")
        sys.exit(1)
    
    print()
    
    # Check dependencies
    missing_deps = check_dependencies()
    
    if missing_deps:
        print(f"\n⚠️  Missing dependencies: {', '.join(missing_deps)}")
        
        if '--install' in sys.argv:
            print("\n📦 Installing missing dependencies...")
            if install_dependencies():
                print("✅ Installation completed, re-checking...")
                missing_deps = check_dependencies()
            else:
                print("❌ Installation failed")
                sys.exit(1)
        else:
            print("\n💡 Run with --install to install missing dependencies:")
            print(f"   python {Path(__file__).name} --install")
            print("\n   Or manually install:")
            print(f"   pip install -r requirements.txt")
    
    print()
    
    # Check extractors and CLI
    extractors_ok = check_extractors()
    cli_ok = test_cli_interface()
    
    print()
    
    # Create report
    if '--report' in sys.argv:
        report = create_installation_report()
        report_path = Path(__file__).parent / "installation_report.json"
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Installation report saved: {report_path}")
    
    # Final status
    all_ok = len(missing_deps) == 0 and extractors_ok and cli_ok
    
    if all_ok:
        print("🎉 PDF Bridge installation is complete and ready!")
        print("\n✅ All checks passed:")
        print("   - Python 3.8+ ✅")
        print("   - Dependencies installed ✅")
        print("   - Extractors working ✅") 
        print("   - CLI interface working ✅")
        
        print("\n🚀 You can now use the PDF Bridge:")
        print("   python pdf_extractor.py --input /path/to/file.pdf --output json")
        
        sys.exit(0)
    else:
        print("❌ PDF Bridge installation incomplete")
        print("\n🔧 Please fix the issues above and run this validator again")
        sys.exit(1)


if __name__ == "__main__":
    main()
