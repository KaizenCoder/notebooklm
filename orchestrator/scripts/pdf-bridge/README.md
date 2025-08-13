# PDF Bridge - Python Text Extraction Service

**Version**: 1.0  
**Task-Master**: 16.2 IMPL  
**Équipe**: team-02 (Ingestion)

---

## Vue d'Ensemble

Le PDF Bridge est un service Python autonome pour l'extraction de texte depuis les fichiers PDF, conçu pour remplacer les mocks PDF dans le pipeline d'ingestion de l'orchestrator Node.js.

### Caractéristiques
- ✅ **Double extraction**: PyMuPDF (rapide) + PDFMiner (robuste) en fallback
- ✅ **Gestion timeout**: Protection contre les PDFs problématiques  
- ✅ **Métadonnées complètes**: Titre, auteur, dates, statistiques
- ✅ **Formats de sortie**: JSON structuré ou texte plain
- ✅ **Codes d'erreur standardisés**: Conformes à la spécification
- ✅ **Isolation processus**: Spawn sécurisé depuis Node.js

---

## Installation

### 1. Prérequis Système
```bash
# Python 3.8+ requis
python --version  # Doit être 3.8+

# Sur Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# Sur Windows: installer Python depuis python.org
# Sur macOS: brew install python3
```

### 2. Installation Dépendances
```bash
cd orchestrator/scripts/pdf-bridge
pip install -r requirements.txt
```

### 3. Vérification Installation
```bash
python pdf_extractor.py --help
```

---

## Utilisation

### CLI Basique
```bash
# Extraction JSON (recommandé)
python pdf_extractor.py --input /path/to/document.pdf --output json

# Extraction texte plain  
python pdf_extractor.py --input /path/to/document.pdf --output text

# Avec timeout personnalisé
python pdf_extractor.py -i document.pdf -o json --timeout 60 --max-pages 100
```

### Arguments CLI Complets
| Argument | Court | Type | Défaut | Description |
|----------|--------|------|---------|-------------|
| `--input` | `-i` | path | **requis** | Chemin absolu vers PDF |
| `--output` | `-o` | choice | `json` | Format: `json`, `text` |
| `--timeout` | `-t` | int | `30` | Timeout en secondes (5-300) |
| `--max-pages` | | int | `1000` | Pages max à traiter (1-5000) |
| `--encoding` | `-e` | choice | `utf-8` | Encodage: `utf-8`, `utf-16`, `latin-1` |
| `--verbose` | `-v` | flag | `false` | Logs verbeux vers stderr |
| `--help` | `-h` | | | Afficher l'aide |

---

## Formats de Sortie

### Success Response (JSON)
```json
{
  "success": true,
  "text": "Contenu PDF extrait...",
  "metadata": {
    "pages": 15,
    "title": "Document Title",
    "author": "Author Name", 
    "creator": "PDF Creator",
    "producer": "Adobe Acrobat",
    "subject": "Document Subject",
    "keywords": "keyword1, keyword2",
    "creation_date": "2025-01-15T10:30:00",
    "modification_date": "2025-01-15T10:30:00", 
    "extraction_method": "pymupdf",
    "file_size": 2048576,
    "processing_time_ms": 1250
  },
  "warnings": [],
  "error": null
}
```

### Error Response (JSON)
```json
{
  "success": false,
  "text": "",
  "metadata": null,
  "warnings": [],
  "error": {
    "code": "TIMEOUT_EXCEEDED",
    "message": "PDF extraction timed out after 30 seconds",
    "details": {
      "file_path": "/path/to/file.pdf",
      "timeout": 30,
      "pages_processed": 8,
      "extraction_method": "pymupdf"
    }
  }
}
```

---

## Codes d'Erreur

### Erreurs Fichier
- `FILE_NOT_FOUND`: Fichier PDF non trouvé
- `FILE_NOT_READABLE`: Permissions insuffisantes
- `INVALID_PDF`: Format PDF invalide ou corrompu
- `FILE_TOO_LARGE`: Fichier trop volumineux
- `ENCRYPTED_PDF`: PDF protégé par mot de passe

### Erreurs Processing  
- `TIMEOUT_EXCEEDED`: Timeout dépassé
- `MEMORY_EXCEEDED`: Mémoire insuffisante
- `CORRUPTED_PDF`: Structure PDF corrompue
- `EXTRACTION_FAILED`: Échec PyMuPDF et PDFMiner

### Erreurs Système
- `PYTHON_DEPS_MISSING`: Dépendances Python manquantes
- `OUTPUT_ENCODING_ERROR`: Erreur d'encodage sortie
- `INVALID_ARGUMENTS`: Arguments CLI invalides

---

## Architecture Interne

### Stratégie Double Extraction
```
Input PDF
    ↓
PyMuPDF (Primaire)
    ↓ (succès)
Return Result
    ↓ (échec récupérable)
PDFMiner (Fallback) 
    ↓
Return Result
```

### Conditions Fallback
Le fallback PDFMiner est tenté si PyMuPDF échoue pour:
- `CORRUPTED_PDF`: PDF structure problématique
- `INVALID_PDF`: Format non standard  
- `EXTRACTION_FAILED`: Erreur technique PyMuPDF

**Pas de fallback pour**:
- `FILE_NOT_FOUND`, `ENCRYPTED_PDF`, `TIMEOUT_EXCEEDED`, `MEMORY_EXCEEDED`

---

## Intégration Node.js

### Service PDF Modifié
```typescript
// orchestrator/src/services/pdf.ts
import { spawn } from 'child_process';
import path from 'path';

export function createPdf(env: Env) {
  return {
    async extractText(filePath: string): Promise<{
      text: string;
      metadata?: PdfMetadata;
    }> {
      const bridgePath = path.join(__dirname, '../scripts/pdf-bridge/pdf_extractor.py');
      const timeout = env.PDF_BRIDGE_TIMEOUT || 30;
      
      const result = await spawnPython(bridgePath, [
        '--input', filePath,
        '--output', 'json', 
        '--timeout', String(timeout)
      ]);
      
      const response = JSON.parse(result.stdout);
      
      if (!response.success) {
        throw new PdfExtractionError(
          response.error.code,
          response.error.message,
          response.error.details
        );
      }
      
      return {
        text: response.text,
        metadata: response.metadata
      };
    }
  };
}
```

---

## Performance

### Benchmarks Typiques
| Taille PDF | Pages | Temps PyMuPDF | Temps PDFMiner | Mémoire |
|------------|-------|---------------|----------------|---------|
| < 1MB      | 1-5   | 0.5-2s        | 1-5s           | < 50MB  |
| 1-10MB     | 5-50  | 2-8s          | 5-20s          | < 200MB |
| 10-50MB    | 50-200| 8-25s         | 20-45s         | < 500MB |

### Limites
- **Taille max**: 100MB par fichier (recommandé)
- **Pages max**: 1000 pages (configurable)
- **Timeout max**: 300 secondes
- **Concurrent**: 1 extraction par fichier

---

## Tests et Validation

### Test Manuel
```bash
# Test fichier simple
python pdf_extractor.py -i test.pdf -o json -v

# Test timeout
python pdf_extractor.py -i large.pdf -t 10 -v

# Test format text
python pdf_extractor.py -i simple.pdf -o text
```

### Codes de Sortie
- `0`: Extraction réussie
- `1`: Erreur (détails dans JSON output)
- `2`: Arguments CLI invalides  
- `130`: Interrompu (Ctrl+C)
- `143`: Terminé (SIGTERM)

---

## Dépannage

### Erreur "PyMuPDF not found"
```bash
pip install PyMuPDF>=1.23.0
```

### Erreur "pdfminer not found"  
```bash
pip install pdfminer.six>=20221105
```

### Permissions fichier
```bash
chmod +r document.pdf  # Lecture
python pdf_extractor.py -i $(realpath document.pdf) -o json
```

### Debugging verbose
```bash
python pdf_extractor.py -i document.pdf -o json -v
# Logs vers stderr, résultat JSON vers stdout
```

---

## Sécurité

### Validation Input
- Chemins absolus obligatoires (pas de `../`)
- Extension `.pdf` requise
- Validation existence et permissions fichier
- Sanitization arguments CLI (pas d'injection)

### Isolation
- Processus Python isolé du Node.js parent
- Timeout strict avec kill forcé si nécessaire
- Pas d'exécution shell (spawn direct)
- Gestion signaux pour arrêt propre

---

## Maintenance

### Logs
Les logs verbeux (`-v`) vont vers **stderr**, la sortie JSON vers **stdout**.

### Monitoring Recommandé
```typescript
// Métriques à surveiller
- pdf_extraction_duration_ms
- pdf_extraction_success_rate  
- pdf_extraction_error_codes
- pdf_file_sizes_processed
- pdf_extraction_fallback_rate
```

### Mise à jour
```bash
cd orchestrator/scripts/pdf-bridge
pip install -r requirements.txt --upgrade
python pdf_extractor.py --help  # Vérifier version
```

---

**Auteur**: IA-Impl-01  
**Équipe**: team-02 (Ingestion)  
**Status**: Production Ready
