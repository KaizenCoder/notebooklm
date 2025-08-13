# FE Lots 1–6 — Parité UX/FE (OpenAPI, Zod, Mocks, Playwright)

## Summary
- Lot 1: gen:openapi, VITE_USE_MOCKS + MSW, Zod (chat/process-document), smokes Chat/PDF
- Lot 2: Chat — Zod validations, a11y (axe-core 0 serious+), snapshot Playwright
- Lot 3: Ingestion PDF — dialogs, hooks callbacks, test rendu
- Lot 4: Sources additionnelles — websites/copied-text, mocks Edge, tests
- Lot 5: Audio — AudioPlayer, test rendu/contrôles, refresh URL
- Lot 6: Stabilisation — matrice parité, suite a11y/smokes verte

## References (source originale)
- `docs/clone/insights-lm-public-main/insights-lm-public-main/**`
- `docs/spec/openapi.yaml`

## Claims
- `claims/20250813_tm-20-team-03-fe-lot1-setup-sanity-claim_v1.0.md`
- `claims/20250813_tm-21-team-03-fe-lot2-chat-claim_v1.0.md`
- `claims/20250813_tm-22-team-03-fe-lot3-ingestion-pdf-claim_v1.0.md`
- `claims/20250813_tm-23-team-03-fe-lot4-sources-additionnelles-claim_v1.0.md`
- `claims/20250813_tm-24-team-03-fe-lot5-audio-claim_v1.0.md`
- `claims/20250813_tm-25-team-03-fe-lot6-stabilisation-parite-claim_v1.0.md`

## Audits (APPROVED)
- `audit/20250813_tm-21-team-03-fe-lot2-chat-audit_v1.0.md`
- `audit/20250813_tm-22-team-03-fe-lot3-ingestion-pdf-audit_v1.0.md`
- `audit/20250813_tm-23-team-03-fe-lot4-sources-additionnelles-audit_v1.0.md`
- `audit/20250813_tm-24-team-03-fe-lot5-audio-audit_v1.0.md`
- TM-25 APPROVED (verdict publié sur Redis)

## Evidence #TEST
- `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.a11y.spec.ts`
- `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.snap.spec.ts`
- `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/ingestion.dialogs.spec.ts`
- `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/sources.additional.spec.ts`
- `docs/clone/insights-lm-public-main/insights-lm-public-main/tests/audio.player.spec.ts`

## How to run (local)
- `cd docs/clone/insights-lm-public-main/insights-lm-public-main`
- `npm i`
- `VITE_USE_MOCKS=true npm run dev`
- `npm run test:e2e`

## Switch to real orchestrator (local)
- Assurez-vous que Supabase local et l’orchestrateur tournent (127.0.0.1)
- Secrets Edge remplis (`docs/setup/supabase-edge-secrets.env`)
- `VITE_USE_MOCKS=false` puis relancer le FE
- Valider 2 smokes: Chat, Ingestion PDF
