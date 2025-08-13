# FE + UX — Peer Review Brief (Parité stricte)

## 1) Contexte & Objectif
- Contexte: Clonage du frontend original d’InsightsLM Local, sans nouvelle UX, en le branchant sur l’orchestrateur local (remplace n8n) via Supabase Edge Functions.
- Objectif: Valider, en revue croisée, que le plan FE+UX est conforme à l’original et à nos règles (parité stricte, local‑only, sécurité, Redis obligatoire) et que la préparation permet une intégration rapide.
- Finalité: Autoriser le démarrage parallèle UX+FE et l’exécution des smoke tests FE↔BE, avec gates d’avancement validées par l’auditeur.

## 2) Analyse de portée (Scope)
- UX: clonage 1:1 des écrans, composants shadcn/radix, styles Tailwind, accessibilité Radix; aucun ajout UX.
- FE: pages/routes, providers, hooks/services Supabase, intégration Edge Functions (mocks contractuels autorisés tant que les webhooks réels ne sont pas disponibles), bascule vers orchestrateur réel ensuite.
- Sécurité: secrets non exposés côté FE; `Authorization` injecté côté Edge Functions.
- Local‑only: DB PostgreSQL locale (pgvector), Supabase local, Orchestrator local.
- Bus Redis: heartbeats + publications obligatoires (STATUS_UPDATE avant claims; AUDIT_REQUEST/VERDICT pour audits).

## 3) Références (Source de vérité)
- Modèle à cloner (frontend original): `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Addendum PRD (alignement local, mapping Edge→Webhooks): `docs/FRONTEND_PRD.md`
- Mapping secrets Edge→Orchestrator: `docs/setup/SUPABASE_SECRETS_MATRIX.md`
- ENV & valeurs locales: `docs/setup/ENVIRONMENT_VALUES.md`
- Guide Supabase local FE↔BE: `docs/setup/GUIDE_SUPABASE_LOCAL_FE_BE.md`
- Plan FE détaillé: `docs/plans/FRONTEND_DEVELOPMENT_PLAN.md`
- Synthèse préparations FE: `docs/frontend/FRONTEND_PREPARATION_SUMMARY.md`

## 4) Fichiers créés/modifiés (exhaustif)
- Créés
  - `.github/pull_request_template.md`
  - `docs/frontend/FRONTEND_PREPARATION_SUMMARY.md`
  - `docs/frontend/FE_UX_PEER_REVIEW_BRIEF.md` (ce document)
  - `docs/setup/ENVIRONMENT_VALUES.md`
  - `docs/setup/GUIDE_SUPABASE_LOCAL_FE_BE.md`
  - `docs/setup/orchestrator.env.example`
  - `docs/setup/supabase-edge-secrets.env`
  - `docs/plans/FRONTEND_DEVELOPMENT_PLAN.md`
  - `docs/checklists/UX_CLONE_CHECKLIST.md`
- Mis à jour
  - `docs/FRONTEND_PRD.md` (+ addendum local, mapping Edge→Orchestrator, parallélisation UX+FE, référence continue)
  - `docs/checklists/FE_BE_VALIDATION_CHECKLIST.md` (Redis claims/audits, référence continue)
  - `docs/checklists/ORCHESTRATOR_READINESS_CHECKLIST.md` (obligations Redis processuelles)
  - `docs/CHECKLIST_TESTS_V1.md` (section Référence Continue)
  - `docs/plans/FINALIZATION_PLAN.md` (exits Redis/claims, gates)
  - `claims/TEMPLATE_CLAIM.md`, `audit/TEMPLATE_AUDIT.md` (encarts Référence continue)
  - `claims/README.md`, `audit/README.md` (référence continue, gates, Redis)
  - `docs/README.md` (section Frontend)

## 5) Plan FE + UX (synthèse opérationnelle)
- Exécution en parallèle (UX + FE) sous parité stricte
  - UX: clonage shadcn/radix, styles Tailwind, tokens, mapping d’écrans/dialogs, audio player.
  - FE: routes/pages, providers (Auth/Query/Tooltip/Toasters), hooks/services Supabase, intégration Edge (mocks → réel).
- Lots (résumé): Setup/Sanity → Chat → Ingestion → Sources additionnelles → Audio → Stabilisation/Parité.
- Gates: validation auditeur obligatoire entre lots (evidence + IDs Redis en PR).

## 6) Critères d’acceptation (peer review)
- Parité UX: composants/écrans et styles identiques au modèle (captures comparatives); A11y Radix OK.
- Parité FE: routes/pages, providers, hooks/services alignés; comportements UI conformes.
- Contrats: payloads/headers/status alignés; callbacks reçus.
- Sécurité: secrets absents du FE; Authorization Edge‑only; logs redaction.
- Local‑only: endpoints 127.0.0.1; DB locale + Supabase local; aucun cloud.
- Redis: STATUS_UPDATE avant claims; AUDIT_REQUEST/VERDICT pour audits; IDs référencés dans PR.
- Référence continue: PRs citent `docs/clone/...`; adaptations liées `docs/DECISIONS.md`; preuves `#TEST:` présentes.

## 7) Checklists de revue (à cocher)
- UX: `docs/checklists/UX_CLONE_CHECKLIST.md`
- FE↔BE: `docs/checklists/FE_BE_VALIDATION_CHECKLIST.md`
- Orchestrator readiness: `docs/checklists/ORCHESTRATOR_READINESS_CHECKLIST.md`
- Tests V1: `docs/CHECKLIST_TESTS_V1.md`

## 8) Risques & mitigations
- Variations contrat: verrouiller via PRD/OpenAPI + tests ciblés.
- GPU indisponible: désactiver `GPU_ONLY` en dev; réactiver pour parité.
- Exposition secrets: contrôle PR + scan; rappeler “Edge‑only”.
- Drift UX: exiger captures comparatives + citation `docs/clone/...`.

## 9) Prochaine étape
- Lot 1 — Setup & Sanity: ENV, secrets Edge, `/health` & `/ready`, 1 chat + 1 ingestion PDF (callbacks). Publication `STATUS_UPDATE`, ouverture claim, gate auditeur.
