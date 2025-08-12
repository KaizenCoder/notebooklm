# Handoff IA-Impl-01 — Opérations à exécuter (Task‑Master + Git)

Contexte
- Branche: `feature/TM-8-fondations-impl`
- Remote: `origin` → `https://github.com/KaizenCoder/notebooklm.git`
- PR cible: base `main`, head `feature/TM-8-fondations-impl`
- Changements clés:
  - GPU-only guard runtime sur `/webhook/chat`, `/webhook/process-document`, `/webhook/process-additional-sources` (503 `GPU_REQUIRED` si probe échoue).
  - Nouveau test contrat: `orchestrator/test/contract/gpu-runtime-guard.test.ts`.
  - MàJ `.taskmaster/tasks/tasks.json` (TM‑8/TM‑18 → review; sous‑tâches mises à jour).

## 1) Commandes Git CLI

- Ajouter et committer les changements (si non poussés):
  - `git add orchestrator/test/contract/gpu-runtime-guard.test.ts .taskmaster/tasks/tasks.json`
  - `git commit -m "TM-18: add contract test for GPU-only runtime guard; TM-8/TM-18: update task statuses to review"`
  - `git push -u origin feature/TM-8-fondations-impl`

- Ouvrir la Pull Request:
  - Web: `https://github.com/KaizenCoder/notebooklm/compare/main...feature/TM-8-fondations-impl?expand=1`
  - Ou via GitHub CLI:
    - `gh pr create --base main --head feature/TM-8-fondations-impl --title "TM-8 TM-18: Adapters finalized; GPU-only guard on webhooks" --body "Adapters validated by contract tests; added GPU-only runtime guard with 503 GPU_REQUIRED on failure; added contract test."`

## 2) Opérations Task‑Master

- Mettre TM‑8 en review (adapters finalisés):
  - `task-master set-status --id 8 --status review`

- Mettre TM‑18 en review (guard runtime ajouté; boot-checks déjà couverts par /ready):
  - `task-master set-status --id 18 --status review`

## 3) Vérifications locales (optionnel)

- Tests contrat:
  - `cd orchestrator && npm run test:contract`

- Vérif ENV minimale pour dev local (exécution à blanc des tests):
  - `NOTEBOOK_GENERATION_AUTH="Bearer test"`
  - `OLLAMA_BASE_URL=http://127.0.0.1:11434` (mocké par tests)
  - `OLLAMA_EMBED_MODEL=nomic-embed-text` (requis si `GPU_ONLY=1`)

## 4) Note

Le validateur claims/audit (`node scripts/validate-claims-audit.mjs`) signale des documents hors périmètre de cette PR. Ne pas bloquer la PR sur ces éléments; ils seront traités séparément par les équipes concernées.

