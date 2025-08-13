# Synthèse — Préparation du Frontend (parité locale)

## Objectif
- Préparer le terrain pour brancher le frontend cloné sur l’orchestrateur local, en stricte parité avec l’original, sans nouvelle UX.

## Travaux réalisés (vue d’ensemble)
- Alignement local: endpoints `http://127.0.0.1:8000`, `Authorization: Bearer test`, Supabase local `http://127.0.0.1:54321`.
- Matrices et guides: variables d’environnement, secrets Edge→Orchestrator, guide Supabase local.
- Plan FE détaillé: lots, critères de sortie, risques, gouvernance (binôme, test‑first, gates auditeur).
- PRD frontend actualisé: addendum d’alignement local, mapping Edge→Webhooks, callbacks, exigences de référence continue au modèle.
- Conformité Redis: rappels claims/audits, obligations de publication, et checklists corrigées.
- Traçabilité revue/validation: template de PR imposant référence au modèle, `#TEST:`, et IDs Redis.

## Fichiers créés
- Configuration/Setup
  - `docs/setup/ENVIRONMENT_VALUES.md`
  - `docs/setup/SUPABASE_SECRETS_MATRIX.md`
  - `docs/setup/GUIDE_SUPABASE_LOCAL_FE_BE.md`
  - `docs/setup/orchestrator.env.example`
  - `docs/setup/supabase-edge-secrets.env`
- Planification
  - `docs/plans/FRONTEND_DEVELOPMENT_PLAN.md`
- Revue/Qualité
  - `.github/pull_request_template.md`

## Fichiers mis à jour
- PRD Frontend
  - `docs/FRONTEND_PRD.md` (+ addendum local, mapping Edge→Orchestrator, callbacks, référence continue)
  - `docs/FRONTEND_PRD.md.bak` (sauvegarde)
- Checklists
  - `docs/checklists/FE_BE_VALIDATION_CHECKLIST.md` (Redis claims/audits, référence continue)
  - `docs/checklists/ORCHESTRATOR_READINESS_CHECKLIST.md` (obligations Redis processuelles)
  - `docs/CHECKLIST_TESTS_V1.md` (section Référence Continue au modèle)
- Finalisation
  - `docs/plans/FINALIZATION_PLAN.md` (exits Redis/claims, gates)
- Templates & README claims/audits
  - `claims/TEMPLATE_CLAIM.md` (encart Référence continue)
  - `audit/TEMPLATE_AUDIT.md` (encart Référence continue)
  - `claims/README.md` (référence continue, gate auditeur)
  - `audit/README.md` (référence continue, binôme & gates)

## Points d’intégration clés (rappel)
- Webhooks Orchestrator (local):
  - POST `/webhook/chat`
  - POST `/webhook/process-document`
  - POST `/webhook/process-additional-sources`
  - POST `/webhook/generate-notebook-content`
  - POST `/webhook/generate-audio`
- Callbacks (depuis Orchestrator → Supabase):
  - `<SUPABASE_URL>/functions/v1/process-document-callback`
  - `<SUPABASE_URL>/functions/v1/audio-generation-callback`
- Secrets Edge (extraits):
  - `NOTEBOOK_CHAT_URL`, `DOCUMENT_PROCESSING_WEBHOOK_URL`, `ADDITIONAL_SOURCES_WEBHOOK_URL`, `NOTEBOOK_GENERATION_URL`, `AUDIO_GENERATION_WEBHOOK_URL`, `NOTEBOOK_GENERATION_AUTH`

## Utilisation rapide (résumé)
- Copier l’ENV backend: `docs/setup/orchestrator.env.example` → `orchestrator/.env`
- Renseigner les secrets Edge: `docs/setup/supabase-edge-secrets.env`
- Suivre le guide: `docs/setup/GUIDE_SUPABASE_LOCAL_FE_BE.md`
- Piloter le FE via le plan: `docs/plans/FRONTEND_DEVELOPMENT_PLAN.md`

## Référence continue & Gouvernance
- Citer systématiquement les fichiers originaux sous `docs/clone/...` dans PR/claims/audits.
- Toute adaptation doit référencer `docs/DECISIONS.md` (rationale, impact).
- Publication Redis obligatoire: `STATUS_UPDATE` avant claims; `AUDIT_REQUEST`/`AUDIT_VERDICT` pour audits.
- Gates d’avancement: passage à l’étape suivante conditionné au verdict auditeur.
