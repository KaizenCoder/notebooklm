### Checklist de revue MOV (No‑Mocks + Ingestion texte + Idempotency + Logs)

- **Santé/Readiness**
  - Vérifier `GET /health` = 200.
  - Vérifier `GET /ready` = 200 quand deps OK; 503 `code=NOT_READY` sinon (modèles Ollama manquants, GPU probe KO si `GPU_ONLY=1`).
  - Healthchecks neutres pour Whisper/Coqui.

- **GPU guard (runtime)**
  - Endpoints protégés: `POST /webhook/chat`, `POST /webhook/process-document`, `POST /webhook/process-additional-sources`.
  - Attendu si `GPU_ONLY=1` et probe KO: 503 `{ code: "GPU_REQUIRED" }`.
  - #TEST: `orchestrator/test/contract/gpu-runtime-guard.test.ts`.

- **No‑Mocks & Anti‑Mock**
  - Hook PowerShell: `scripts/git-hooks/pre-push.ps1` (bloquant, force `NO_MOCKS=1`).
  - Installation recommandée: `npm run prepare:hooks`.
  - Scan lexical: `pwsh -File ci/anti-mock-scan.ps1` → OK attendu.
  - Check E2E no‑mocks: `pwsh -File ci/no-mocks-check.ps1` → OK attendu.

- **Idempotency**
  - Couverture: `process-document`, `process-additional-sources`.
  - Attendu: même `Idempotency-Key` → réponse cache (202/200 identique), pas de ré‑upserts.
  - #TEST: `orchestrator/test/contract/idempotency*.test.ts`.

- **Ingestion texte + callbacks**
  - `POST /webhook/process-document` (texte): upsert + callback `completed` sur succès, `failed` en erreur job.
  - `POST /webhook/process-additional-sources` (copied-text, multiple-websites): upsert + statut OK.
  - #TEST: `orchestrator/test/contract/process-document-*.test.ts`, `additional-sources.test.ts`, `generate-audio-callback.test.ts` (pour pattern callback).

- **Logs & Sécurité**
  - Redaction headers: `authorization`, `idempotency-key`.
  - `x-correlation-id` sur réponses; présence `correlation_id` dans logs.
  - Heartbeats/Blockers présents pour `process-document` et `generate-audio`.
  - #TEST: `logging-redaction.test.ts`, `process-document-step-logs.test.ts`, `generate-audio-step-logs.test.ts`.

- **Rejeu local (MOV)**
  - Contrats/Intégration/E2E: `npm run -s test:contract && npm run -s test:integration && npm run -s test:e2e`.
  - Pipeline locale: `pwsh -File ci/local-ci.ps1` (anti‑mock → no‑mocks E2E → tests).

- **Claims liés**
  - `claims/20250812_tm-15.2+15.3+19.2-team-01-foundations-mov-claim_v1.0.md`
  - `claims/20250812_tm-19.3-team-01-foundations-additional-sources-mov-claim_v1.0.md`

- **Limitations (acceptées en MOV)**
  - Adaptateurs `Coqui`/`Whisper`: clients minimaux (pas de retours simulés). Tests unitaires spécifiques adapters à réviser ultérieurement.
  - PDF bridge et audio avancé: hors scope MOV.

Checklist à cocher par l’auditeur:
- [ ] Santé/Ready OK (200/503 attendu) et GPU probe conforme
- [ ] Anti‑mock OK et hook pre‑push actif
- [ ] Idempotency OK (rejeu non‑duplicatif)
- [ ] Ingestion texte + callbacks OK
- [ ] Logs redaction + correlation_id OK
- [ ] CI locale MOV verte