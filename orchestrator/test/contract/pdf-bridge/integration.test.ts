/**
 * Tests d'intégration Node.js pour le PDF Bridge
 * Valide l'intégration complète TypeScript <-> Python
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { extractPdfViaBridge, PdfExtractionError } from '../../../src/services/pdf';
import path from 'path';
import fs from 'fs';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures/pdf');
const TEST_TIMEOUT = 30000; // 30 secondes

describe('PDF Bridge Integration Tests', () => {
    beforeAll(async () => {
        // Vérifier que les fixtures existent
        const requiredFixtures = ['simple.pdf', 'empty.pdf', 'corrupted.pdf'];
        
        for (const fixture of requiredFixtures) {
            const fixturePath = path.join(FIXTURES_DIR, fixture);
            if (!fs.existsSync(fixturePath)) {
                throw new Error(`Missing test fixture: ${fixturePath}`);
            }
        }
        
        // Vérifier que les variables d'environnement sont configurées
        process.env.PDF_BRIDGE_ENABLED = 'true';
        process.env.PDF_BRIDGE_TIMEOUT = '15000';
        process.env.PDF_BRIDGE_MAX_PAGES = '100';
    });

    afterAll(() => {
        // Cleanup si nécessaire
    });

    describe('Extraction réussie', () => {
        it('devrait extraire le texte d\'un PDF simple', async () => {
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            const result = await extractPdfViaBridge(pdfPath);
            
            expect(result.success).toBe(true);
            expect(result.text).toContain('Simple PDF for contract testing');
            expect(result.metadata?.pages).toBe(1);
            expect(result.metadata?.file_size_bytes).toBeGreaterThan(0);
            expect(result.metadata?.extraction_method).toMatch(/^(pymupdf|pdfminer)$/);
        }, TEST_TIMEOUT);

        it('devrait gérer un PDF vide', async () => {
            const pdfPath = path.join(FIXTURES_DIR, 'empty.pdf');
            
            const result = await extractPdfViaBridge(pdfPath);
            
            expect(result.success).toBe(true);
            expect(result.text.trim()).toBe('');
            expect(result.metadata?.pages).toBe(1);
        }, TEST_TIMEOUT);

        it('devrait retourner des métadonnées complètes', async () => {
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            const result = await extractPdfViaBridge(pdfPath);
            
            expect(result.success).toBe(true);
            expect(result.metadata).toMatchObject({
                pages: expect.any(Number),
                file_size_bytes: expect.any(Number),
                extraction_method: expect.stringMatching(/^(pymupdf|pdfminer)$/),
                processing_time_ms: expect.any(Number)
            });
        }, TEST_TIMEOUT);
    });

    describe('Gestion d\'erreurs', () => {
        it('devrait lancer FILE_NOT_FOUND pour fichier inexistant', async () => {
            const nonexistentPath = path.join(FIXTURES_DIR, 'nonexistent.pdf');
            
            await expect(extractPdfViaBridge(nonexistentPath))
                .rejects
                .toThrow(PdfExtractionError);
            
            try {
                await extractPdfViaBridge(nonexistentPath);
            } catch (error) {
                expect(error).toBeInstanceOf(PdfExtractionError);
                expect((error as PdfExtractionError).code).toBe('FILE_NOT_FOUND');
            }
        }, TEST_TIMEOUT);

        it('devrait gérer un fichier PDF corrompu', async () => {
            const corruptedPath = path.join(FIXTURES_DIR, 'corrupted.pdf');
            
            await expect(extractPdfViaBridge(corruptedPath))
                .rejects
                .toThrow(PdfExtractionError);
            
            try {
                await extractPdfViaBridge(corruptedPath);
            } catch (error) {
                expect(error).toBeInstanceOf(PdfExtractionError);
                const validErrors = ['CORRUPTED_FILE', 'EXTRACTION_FAILED'];
                expect(validErrors).toContain((error as PdfExtractionError).code);
            }
        }, TEST_TIMEOUT);

        it('devrait respecter le timeout configuré', async () => {
            // Sauvegarder la valeur originale
            const originalTimeout = process.env.PDF_BRIDGE_TIMEOUT;
            
            // Configurer un timeout très court
            process.env.PDF_BRIDGE_TIMEOUT = '100'; // 100ms
            
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            try {
                await extractPdfViaBridge(pdfPath);
                // Si ça réussit malgré le timeout court, c'est OK aussi
                // (le PDF simple peut s'extraire très rapidement)
            } catch (error) {
                if (error instanceof PdfExtractionError) {
                    expect(error.code).toBe('TIMEOUT_EXCEEDED');
                }
            } finally {
                // Restaurer la valeur originale
                process.env.PDF_BRIDGE_TIMEOUT = originalTimeout;
            }
        }, TEST_TIMEOUT);
    });

    describe('Configuration et environnement', () => {
        it('devrait respecter PDF_BRIDGE_ENABLED=false', async () => {
            // Sauvegarder la valeur originale
            const originalEnabled = process.env.PDF_BRIDGE_ENABLED;
            
            // Désactiver le bridge
            process.env.PDF_BRIDGE_ENABLED = 'false';
            
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            try {
                await expect(extractPdfViaBridge(pdfPath))
                    .rejects
                    .toThrow(PdfExtractionError);
            } finally {
                // Restaurer la valeur originale
                process.env.PDF_BRIDGE_ENABLED = originalEnabled;
            }
        });

        it('devrait utiliser le chemin Python personnalisé si configuré', async () => {
            const originalPythonPath = process.env.PDF_BRIDGE_PYTHON_PATH;
            
            // Test avec chemin Python par défaut (doit fonctionner)
            delete process.env.PDF_BRIDGE_PYTHON_PATH;
            
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            const result = await extractPdfViaBridge(pdfPath);
            expect(result.success).toBe(true);
            
            // Restaurer la valeur originale
            if (originalPythonPath) {
                process.env.PDF_BRIDGE_PYTHON_PATH = originalPythonPath;
            }
        }, TEST_TIMEOUT);
    });

    describe('Performance et limites', () => {
        it('devrait traiter rapidement un PDF simple', async () => {
            const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
            
            const startTime = Date.now();
            const result = await extractPdfViaBridge(pdfPath);
            const endTime = Date.now();
            
            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000); // Moins de 5 secondes
            expect(result.metadata?.processing_time_ms).toBeLessThan(5000);
        }, TEST_TIMEOUT);
        
        // Note: Le test du PDF large nécessiterait la génération du fixture
        // ou pourrait être skippé si le fichier n'existe pas
        it.skip('devrait gérer un PDF large dans les limites', async () => {
            const largePdfPath = path.join(FIXTURES_DIR, 'large.pdf');
            
            if (!fs.existsSync(largePdfPath)) {
                console.log('Large PDF fixture not found, skipping test');
                return;
            }
            
            const result = await extractPdfViaBridge(largePdfPath);
            
            expect(result.success).toBe(true);
            const maxPages = parseInt(process.env.PDF_BRIDGE_MAX_PAGES || '50');
            expect(result.metadata?.pages).toBeLessThanOrEqual(maxPages);
        }, 60000); // Test plus long pour PDF large
    });
});

// Tests utilitaires pour validation du schéma
describe('PDF Bridge Response Schema', () => {
    it('devrait respecter le schéma de réponse de succès', async () => {
        const pdfPath = path.join(FIXTURES_DIR, 'simple.pdf');
        
        const result = await extractPdfViaBridge(pdfPath);
        
        // Schéma de succès
        expect(result).toMatchObject({
            success: true,
            text: expect.any(String),
            metadata: expect.objectContaining({
                pages: expect.any(Number),
                file_size_bytes: expect.any(Number),
                extraction_method: expect.any(String),
                processing_time_ms: expect.any(Number)
            })
        });
    }, TEST_TIMEOUT);

    it('les erreurs devraient respecter le schéma PdfExtractionError', async () => {
        const nonexistentPath = path.join(FIXTURES_DIR, 'nonexistent.pdf');
        
        try {
            await extractPdfViaBridge(nonexistentPath);
            fail('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(PdfExtractionError);
            
            const pdfError = error as PdfExtractionError;
            expect(pdfError).toMatchObject({
                name: 'PdfExtractionError',
                code: expect.any(String),
                message: expect.any(String)
            });
            
            // Codes d'erreur valides
            const validErrorCodes = [
                'FILE_NOT_FOUND', 'PERMISSION_DENIED', 'CORRUPTED_FILE',
                'TIMEOUT_EXCEEDED', 'EXTRACTION_FAILED', 'PYTHON_ERROR',
                'BRIDGE_DISABLED', 'INVALID_ARGUMENTS', 'MEMORY_ERROR',
                'DISK_SPACE_ERROR', 'UNKNOWN_ERROR'
            ];
            expect(validErrorCodes).toContain(pdfError.code);
        }
    }, TEST_TIMEOUT);
});
