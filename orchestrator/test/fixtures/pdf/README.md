# Test Fixtures pour PDF Bridge

## Structure des fixtures de test

### 1. **simple.pdf**
- **Usage**: Test basique d'extraction de texte
- **Contenu**: "Simple PDF for contract testing\nSecond line of text"
- **Pages**: 1 page
- **Taille**: ~320 bytes
- **Scénario**: Test de succès standard

### 2. **large.pdf** 
- **Usage**: Test de performance et pagination
- **Contenu**: Texte répété sur 50 pages
- **Pages**: 50 pages
- **Taille**: ~2MB
- **Scénario**: Test de PDF_BRIDGE_MAX_PAGES et performance

### 3. **corrupted.pdf**
- **Usage**: Test d'erreur CORRUPTED_FILE
- **Contenu**: PDF avec structure corrompue
- **Pages**: N/A
- **Taille**: Variable
- **Scénario**: Test de gestion d'erreur extraction

### 4. **empty.pdf**
- **Usage**: Test de PDF sans texte extractible
- **Contenu**: PDF valide mais sans contenu textuel
- **Pages**: 1 page vide
- **Taille**: ~200 bytes
- **Scénario**: Test extraction vide mais réussie

### 5. **nonexistent.pdf**
- **Usage**: Test d'erreur FILE_NOT_FOUND
- **Contenu**: Fichier inexistant
- **Pages**: N/A
- **Taille**: N/A
- **Scénario**: Test de validation d'existence fichier

## Utilisation dans les tests

```javascript
// Test simple extraction
const result = await extractPdf('test/fixtures/pdf/simple.pdf');
assert(result.success === true);
assert(result.text.includes('Simple PDF for contract testing'));

// Test large file handling
const largeResult = await extractPdf('test/fixtures/pdf/large.pdf');
assert(largeResult.metadata.pages <= process.env.PDF_BRIDGE_MAX_PAGES);

// Test error handling
const errorResult = await extractPdf('test/fixtures/pdf/corrupted.pdf');
assert(errorResult.success === false);
assert(errorResult.error === 'CORRUPTED_FILE');
```
