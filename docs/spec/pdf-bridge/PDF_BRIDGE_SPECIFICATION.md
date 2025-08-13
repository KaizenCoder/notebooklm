# PDF Extraction Bridge — Spécification Technique v1.0

**Task-Master**: 16.1  
**Équipe**: team-02 (Ingestion)  
**Statut**: SPEC  
**Version**: 1.0  
**Date**: 2025-08-13

---

## 1. Vue d'Ensemble

### 1.1 Objectif
Créer un pont Python fiable et performant pour l'extraction de texte depuis les fichiers PDF, respectant la parité stricte avec l'original InsightsLM et garantissant une sortie déterministe pour le pipeline d'ingestion.

### 1.2 Architecture Générale
```
Node.js Orchestrator (TypeScript)
         ↓ (CLI/Process spawn)
Python PDF Bridge (Script Python)
         ↓ (PyMuPDF/pdfminer)
Fichier PDF → Texte extrait + Métadonnées
```

### 1.3 Principes Directeurs
- **Clone Strict**: Reproduction fidèle du comportement original
- **Déterminisme**: Sortie identique pour le même PDF 
- **Résilience**: Gestion robuste des erreurs et timeouts
- **Performance**: Extraction efficace avec gestion mémoire

---

## 2. Interface de Communication

### 2.1 Protocole CLI (Choisi)
**Format**: Spawn de processus Python avec arguments CLI

**Commande**:
```bash
python pdf_extractor.py --input <file_path> --output json --timeout 30
```

**Alternatives évaluées**:
- ❌ gRPC : Complexité excessive pour cas d'usage simple
- ❌ HTTP API : Overhead inutile 
- ✅ **CLI** : Simplicité, robustesse, isolation processus

### 2.2 Arguments CLI
| Argument | Type | Obligatoire | Description |
|----------|------|-------------|-------------|
| `--input` | string | ✅ | Chemin absolu vers fichier PDF |
| `--output` | enum | ✅ | Format sortie: `json`, `text` |
| `--timeout` | number | ❌ | Timeout en secondes (défaut: 30s) |
| `--max-pages` | number | ❌ | Limite pages (défaut: 1000) |
| `--encoding` | string | ❌ | Encodage sortie (défaut: utf-8) |

### 2.3 Format de Sortie JSON
```json
{
  "success": true,
  "text": "Contenu extrait...",
  "metadata": {
    "pages": 15,
    "title": "Document Title",
    "author": "Author Name",
    "creator": "PDF Creator",
    "producer": "PDF Producer",
    "subject": "Document Subject",
    "keywords": "keyword1, keyword2",
    "creation_date": "2025-01-15T10:30:00Z",
    "modification_date": "2025-01-15T10:30:00Z",
    "extraction_method": "pymupdf",
    "file_size": 2048576,
    "processing_time_ms": 1250
  },
  "warnings": [],
  "error": null
}
```

### 2.4 Format d'Erreur
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
      "pages_processed": 8
    }
  }
}
```

---

## 3. Codes d'Erreur Standardisés

### 3.1 Erreurs Fichier
| Code | Message | Action |
|------|---------|--------|
| `FILE_NOT_FOUND` | PDF file not found at path | Vérifier file_path |
| `FILE_NOT_READABLE` | Cannot read PDF file | Permissions/corruption |
| `INVALID_PDF` | File is not a valid PDF | Format invalide |
| `FILE_TOO_LARGE` | PDF exceeds maximum size limit | Limite taille |

### 3.2 Erreurs Processing
| Code | Message | Action |
|------|---------|--------|
| `TIMEOUT_EXCEEDED` | Extraction timed out | Augmenter timeout |
| `MEMORY_EXCEEDED` | Insufficient memory for processing | Réduire max-pages |
| `CORRUPTED_PDF` | PDF structure is corrupted | Fichier corrompu |
| `ENCRYPTED_PDF` | PDF is password protected | Nécessite mot de passe |

### 3.3 Erreurs Système
| Code | Message | Action |
|------|---------|--------|
| `PYTHON_DEPS_MISSING` | Required Python packages not installed | pip install |
| `EXTRACTION_FAILED` | PyMuPDF/pdfminer extraction failed | Fallback |
| `OUTPUT_ENCODING_ERROR` | Cannot encode output to UTF-8 | Encoding |

---

## 4. Implémentation Python

### 4.1 Structure du Script
```
orchestrator/
├── scripts/
│   └── pdf-bridge/
│       ├── pdf_extractor.py     # Script principal CLI
│       ├── extractors/
│       │   ├── __init__.py
│       │   ├── pymupdf_extractor.py
│       │   └── pdfminer_extractor.py
│       ├── requirements.txt     # Dépendances Python
│       └── README.md           # Instructions
```

### 4.2 Dépendances Python (requirements.txt)
```
PyMuPDF>=1.23.0,<2.0.0
pdfminer.six>=20221105
python-dateutil>=2.8.0
```

### 4.3 Stratégie Extraction Hybride
1. **Primaire**: PyMuPDF (rapidité, métadonnées)
2. **Fallback**: pdfminer.six (robustesse, PDF complexes)  
3. **Critères fallback**:
   - PyMuPDF échec ou timeout
   - Texte extrait < 10 caractères
   - Exception critique PyMuPDF

### 4.4 Gestion Métadonnées
- Extraction titre/auteur/créateur depuis PDF metadata
- Calcul statistiques (pages, taille fichier)  
- Mesure temps de traitement
- Détection méthode extraction utilisée

---

## 5. Intégration Node.js

### 5.1 Service PDF Modifié
```typescript
// orchestrator/src/services/pdf.ts
import { spawn } from 'child_process';
import { Env } from '../env.js';

export function createPdf(env: Env) {
  return {
    async extractText(filePath: string): Promise<{
      text: string;
      metadata?: PdfMetadata;
    }> {
      return extractPdfViaBridge(filePath, env.PDF_BRIDGE_TIMEOUT || 30);
    }
  };
}

interface PdfMetadata {
  pages: number;
  title?: string;
  author?: string;
  creator?: string;
  processingTimeMs: number;
}
```

### 5.2 Fonction extractPdfViaBridge
```typescript
async function extractPdfViaBridge(
  filePath: string, 
  timeoutSeconds: number = 30
): Promise<{ text: string; metadata?: PdfMetadata }> {
  
  const pythonScript = path.join(__dirname, '../../scripts/pdf-bridge/pdf_extractor.py');
  const args = ['--input', filePath, '--output', 'json', '--timeout', timeoutSeconds.toString()];
  
  const result = await spawnPythonProcess('python', [pythonScript, ...args], {
    timeout: (timeoutSeconds + 5) * 1000, // Buffer 5s
    cwd: process.cwd(),
    env: process.env
  });
  
  const response = JSON.parse(result.stdout);
  
  if (!response.success) {
    throw new PdfExtractionError(response.error.code, response.error.message, response.error.details);
  }
  
  return {
    text: response.text,
    metadata: response.metadata
  };
}
```

---

## 6. Gestion des Erreurs et Timeout

### 6.1 Timeout Multi-Niveau
- **Python**: Timeout interne PyMuPDF/pdfminer (--timeout)
- **Node.js**: Timeout processus spawn (+5s buffer)
- **Orchestrator**: Timeout global endpoint webhook

### 6.2 Fallback Strategy
```
PDF Input
    ↓
PyMuPDF (30s)
    ↓ (échec)
pdfminer.six (30s)
    ↓ (échec)  
Error Response
```

### 6.3 Logging et Observabilité
```typescript
// Logs structurés pour monitoring
logger.info('PDF extraction started', {
  filePath,
  fileSize: await getFileSize(filePath),
  timeout: timeoutSeconds
});

logger.info('PDF extraction completed', {
  filePath,
  success: true,
  method: 'pymupdf',
  pages: metadata.pages,
  processingTimeMs: metadata.processingTimeMs,
  textLength: text.length
});
```

---

## 7. Conformité et Parité

### 7.1 Respect Original
- **Chunking**: Texte extrait compatible avec chunkTokens() existant
- **Métadonnées**: Structure compatible document.ts metadata
- **Encodage**: UTF-8 strict pour compatibilité embeddings
- **Performance**: < 30s pour PDF typiques (< 100 pages)

### 7.2 Variables d'Environnement
```bash
# .env
PDF_BRIDGE_TIMEOUT=30          # Timeout extraction (secondes)
PDF_BRIDGE_MAX_PAGES=1000      # Limite pages
PDF_BRIDGE_PYTHON_PATH=python  # Chemin Python (optionnel)
```

### 7.3 Intégration Tests Existants
- **Contrat**: `process-document-pdf-audio.test.ts` → texte réel
- **Intégration**: `process-document-pdf.test.ts` → extraction complète
- **Mock**: Conserver mocks pour développement

---

## 8. Déploiement et Installation

### 8.1 Dépendances Système
```bash
# Ubuntu/Debian
apt update && apt install python3 python3-pip

# Windows
# Python 3.9+ depuis python.org

# macOS  
brew install python3
```

### 8.2 Installation Bridge
```bash
cd orchestrator/scripts/pdf-bridge
pip install -r requirements.txt

# Test installation
python pdf_extractor.py --help
```

### 8.3 Validation Installation
```bash
# Script de validation
node scripts/test-pdf-bridge.js
```

---

## 9. Performance et Limites

### 9.1 Performances Cibles
| Métrique | Cible | Limite |
|----------|--------|---------|
| PDF < 10 pages | < 5s | < 15s |
| PDF < 100 pages | < 30s | < 60s |
| PDF > 100 pages | < 60s | TIMEOUT |
| Mémoire pic | < 500MB | < 1GB |

### 9.2 Limitations
- **Format**: PDFs uniquement (pas d'images, DOCX, etc.)
- **Taille**: Max 100MB par fichier
- **Pages**: Max 1000 pages par défaut
- **Concurrent**: 1 extraction par fichier simultanément

### 9.3 Exclusions Scope v1.0
- ❌ OCR pour PDFs scannés
- ❌ Extraction images/diagrammes  
- ❌ Parsing tableaux complexes
- ❌ Support PDFs chiffrés
- ❌ Extraction annotations/commentaires

---

## 10. Tests et Validation

### 10.1 Jeux de Test
```
orchestrator/test/fixtures/pdf/
├── simple.pdf              # PDF texte simple (2 pages)
├── complex.pdf              # PDF multi-colonnes (20 pages) 
├── large.pdf                # PDF volumineux (500+ pages)
├── corrupted.pdf            # PDF corrompu (test erreurs)
└── encrypted.pdf            # PDF protégé mot de passe
```

### 10.2 Tests Contract
```typescript
// orchestrator/test/contract/pdf-bridge.test.ts
describe('PDF Bridge Contract', () => {
  test('should extract simple PDF text', async () => {
    const result = await pdfService.extractText('./test/fixtures/pdf/simple.pdf');
    expect(result.text).toContain('expected content');
    expect(result.metadata.pages).toBe(2);
  });
  
  test('should handle timeout gracefully', async () => {
    await expect(
      pdfService.extractText('./test/fixtures/pdf/large.pdf')
    ).rejects.toThrow('TIMEOUT_EXCEEDED');
  });
});
```

---

## 11. Migration et Rollback

### 11.1 Plan Migration
1. **Phase 1**: Déploiement bridge avec mocks actifs
2. **Phase 2**: Tests A/B sur endpoints non-critique  
3. **Phase 3**: Migration progressive process-document
4. **Phase 4**: Suppression mocks

### 11.2 Stratégie Rollback
- **Feature flag**: `PDF_BRIDGE_ENABLED=false` → retour mocks
- **Graceful degradation**: Échec bridge → mock fallback
- **Monitoring**: Alertes sur taux erreur > 5%

---

## 12. Sécurité

### 12.1 Isolation Processus
- Spawn Python process isolé
- Timeout strict (kill -9 si nécessaire)
- Pas de shell injection (arguments sanitizés)

### 12.2 Validation Input
```typescript
function validatePdfPath(filePath: string): void {
  if (!path.isAbsolute(filePath)) {
    throw new Error('PDF path must be absolute');
  }
  if (!filePath.toLowerCase().endsWith('.pdf')) {
    throw new Error('File must have .pdf extension');
  }
  if (filePath.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
}
```

---

## 13. Conclusion

Cette spécification définit un pont PDF robuste, performant et sécurisé pour remplacer les mocks actuels. L'implémentation CLI Python garantit l'isolation et la simplicité, while respectant la parité stricte avec l'original InsightsLM.

**Prochaines étapes**: 
- ✅ SPEC terminée → marquer 16.1 comme `done`
- 🔄 Démarrer 16.2 IMPL (implémentation Python + intégration Node.js)

---

**Auteur**: IA-Impl-01  
**Reviewers**: team-02, auditeur  
**Approbation**: En attente review
