# UX/FE Parity Matrix (Lots 1–6)

Référence primaire des contrats: `docs/spec/openapi.yaml`. Exemples: `docs/ANNEXES_PAYLOADS.md`. Source UI à cloner: `docs/clone/insights-lm-public-main/insights-lm-public-main`.

Voir aussi:
- PRD Frontend: `docs/FRONTEND_PRD.md`
- Plan de développement FE: `docs/plans/FRONTEND_DEVELOPMENT_PLAN.md`

- Lot 1 — Setup & Sanity: 1 chat + 1 ingestion PDF en UI; Zod fail‑fast; a11y serious+=0; captures/HAR en PR. #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/smoke.spec.ts`, `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/a11y.smoke.spec.ts`
- Lot 2 — Chat: UI ChatArea parité stricte; citations rendues; historique; snapshots stables; a11y=0 serious+. #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.snap.spec.ts`, `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.a11y.spec.ts`
- Lot 3 — Ingestion PDF: dialogs upload/progression; callback reflété; états loading/empty/error/retry présents; idempotence visible (désactivation). #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/ingestion.dialogs.spec.ts`
- Lot 4 — Additional Sources: dialogs websites/copied‑text; indexation visible; idempotence UI; mocks=OK puis réel. #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/sources.additional.spec.ts`
- Lot 5 — Audio: AudioPlayer parité; lecture/pause/seek; gestion erreurs TTS/callback; retry/backoff; snapshots; a11y=0 serious+. #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/audio.player.spec.ts`
- Lot 6 — Stabilisation: matrice 100% couverte; E2E offline vert; a11y pages majeures=0 serious+; dérives UX=0. #TEST: `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/a11y.smoke.spec.ts`, tous les fichiers ci‑dessus (suite verte)
