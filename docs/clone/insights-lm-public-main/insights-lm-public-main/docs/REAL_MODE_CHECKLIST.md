# FE Real Mode Checklist (Edge → Orchestrator)

- VITE_USE_MOCKS=false
- SUPABASE_URL=http://127.0.0.1:54321
- Orchestrator: http://127.0.0.1:8000 (local-only)
- Edge secrets: `docs/setup/supabase-edge-secrets.env` remplis
- Smokes:
  - Chat minimal (Notebook page)
  - Ingestion PDF (dialog + trigger) — vérifier callback visuel
- Logs: pas de secrets; `Authorization` côté Edge only
- Redis: STATUS_UPDATE avec résultats (PASS/FAIL + liens #TEST)
