# MOV: No‑Mocks bloquant + Ingestion texte + Idempotency + Logs minimaux

## Contexte
Passage en MOV (Minimum Observable Product) pour livrer rapidement un produit observable, local-first et sans mocks au runtime. Cette PR active un hook no‑mocks bloquant, nettoie les implémentations simulées, garantit l’idempotence des flux d’ingestion texte et ajoute des logs structurés minimaux avec `correlation_id`.

## Changements clés
- Hook Git pre‑push (PowerShell) robuste et bloquant:
  - `scripts/git-hooks/pre-push.ps1` → force `NO_MOCKS=1`, exécute `ci/anti-mock-scan.ps1` puis `ci/no-mocks-check.ps1`.
  - Wrapper `scripts/git-hooks/pre-push` (shebang) conservé pour environnements Bash/WSL.
- CI locale:
  - `ci/anti-mock-scan.ps1`: scan lexical anti‑mock sur `orchestrator/src` (bloquant si `NO_MOCKS=1`).
  - `ci/no-mocks-check.ps1`: exécution E2E minimale avec `NO_MOCKS=1` et `GPU_ONLY=1`.
  - `ci/local-ci.ps1`: pipeline locale (anti‑mock → no‑mocks E2E → tests).
- Orchestrator runtime:
  - `orchestrator/src/app.ts`: 
    - Redaction des headers sensibles (`authorization`, `idempotency-key`).
    - Hook `onError` avec `correlation_id`.
    - Heartbeats/Blockers pour `process-document` et `generate-audio`.
    - Garde GPU (inchangé) avec cache de probe.
- Adaptateurs audio/ASR (runtime sans valeurs simulées):
  - `orchestrator/src/adapters/coqui.ts`: client minimal Coqui TTS (supprime retours "mock").
  - `orchestrator/src/adapters/whisper.ts`: client minimal Whisper (supprime retours "mock").

## Preuves (tests MOV)
#TEST: orchestrator/test/contract/health.test.ts  
#TEST: orchestrator/test/contract/ready.test.ts  
#TEST: orchestrator/test/contract/ready-failures.test.ts  
#TEST: orchestrator/test/contract/auth.test.ts  
#TEST: orchestrator/test/contract/webhooks.test.ts  
#TEST: orchestrator/test/contract/chat-integration.test.ts  
#TEST: orchestrator/test/contract/chat-persist.test.ts  
#TEST: orchestrator/test/contract/chat-contract-strict.test.ts  
#TEST: orchestrator/test/contract/chat-llm-metrics.test.ts  
#TEST: orchestrator/test/contract/generate-notebook-job.test.ts  
#TEST: orchestrator/test/contract/process-document-job.test.ts  
#TEST: orchestrator/test/contract/document-embeddings.test.ts  
#TEST: orchestrator/test/contract/embeddings-dim-mismatch.test.ts  
#TEST: orchestrator/test/contract/process-document-status.test.ts  
#TEST: orchestrator/test/contract/additional-sources.test.ts  
#TEST: orchestrator/test/contract/payload-validation.test.ts  
#TEST: orchestrator/test/contract/idempotency.test.ts  
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts  
#TEST: orchestrator/test/contract/generate-audio-invalid.test.ts  
#TEST: orchestrator/test/contract/generate-audio.test.ts  
#TEST: orchestrator/test/contract/generate-audio-callback.test.ts  
#TEST: orchestrator/test/contract/logging-redaction.test.ts  
#TEST: orchestrator/test/contract/logging-sampling.test.ts  
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts  
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts  
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts  
#TEST: orchestrator/test/e2e/process-document-edge.test.ts  

Exécution locale MOV (contrats + intégration + e2e) réussie:
- `npm run -s test:contract && npm run -s test:integration && npm run -s test:e2e`
- Anti‑mock scan: OK (aucun motif suspect en runtime)
- No‑mocks E2E: OK

## Idempotency
- Entête `Idempotency-Key` supporté sur `process-document` et `process-additional-sources`.
- TTL configurable via `IDEMPOTENCY_TTL_MS`.

## Logs & Sécurité
- Logs JSON corrélés (champ `correlation_id`) et niveaux minimaux.
- Redaction des headers `authorization` et `idempotency-key`.

## Gouvernance / CI locale
- Hook `pre-push` bloquant (PowerShell) recommandé: `npm run prepare:hooks` (copie dans `.git/hooks/`).
- `ci/local-ci.ps1` pour rejouer la pipeline sur poste.

## Limitations
- Adaptateurs `Coqui` et `Whisper`: clients minimaux (sans valeurs de secours simulées). Les tests unitaires spécifiques adapter (non MOV) seront révisés ultérieurement.
- PDF et audio avancé: hors périmètre MOV.

## Checklist PR
- [x] Anti‑mock OK (runtime propre)
- [x] Hook no‑mocks bloquant opérationnel (PowerShell)
- [x] Ingestion texte + callbacks OK
- [x] Idempotency (document + additional‑sources) OK
- [x] Logs minimaux + `correlation_id` OK
- [x] Tests MOV passants (contract + integration + e2e)
