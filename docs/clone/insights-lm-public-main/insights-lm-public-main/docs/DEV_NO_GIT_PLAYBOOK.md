# Dev Playbook (No Git Window)

- Contexte: Git indisponible temporairement. Continuer le dev et la validation sans bloquer l’équipe.

## FE tasks à poursuivre
- DevBanner (indique mocks ON/OFF, URL supabase)
- Page Preflight `/preflight` pour probes orchestrator /health,/ready (VITE_ORCH_URL)
- Checklist real-mode (`docs/REAL_MODE_CHECKLIST.md`)
- Tests e2e/a11y: se lancent localement (Playwright)

## Publication & gouvernance
- Publier statut via Redis: `scripts/redis-send-status-update.cjs`
- Claims/Audits: créer/mettre à jour fichiers sous `claims/` et `audit/`
- À réintégrer dès que Git revient: utiliser `docs/frontend/PR_FE_LOTS_1_6.md` comme base PR
