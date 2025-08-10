# On-Boarding AI — notebooklm

Ce document prépare un(e) assistant(e) IA à contribuer efficacement au projet.

## 1) Contexte et objectif
- But: cloner localement un flux NotebookLM-like, sans n8n, avec un Orchestrateur API local, Supabase et Ollama.
- Cible: Windows + Docker Desktop + WSL2 + GPU NVIDIA.
- Langue de travail: français.

Références canon:
- Spéc produit: `docs/PRD.md` (Contrats d’API §20 GELÉ V1 + idempotence).
- Plan d’exécution: `projet_plan_de_dev_dataillee_v100.md`.
- Analyse critique: `docs/ANALYSE_PLAN_DE_DEV_V1.md`.
- Infra & installation: `docs/INSTALLATION_CLONE.md`, `docker-compose.yml`, `docs/docker-compose.example.yml`.
- Suivi tâches: `.taskmaster/tasks.json` (config: `.taskmaster/config.json`).
- CI de base: `.github/workflows/ci.yml` (markdownlint, yamllint, lychee).

## 2) Architecture rapide
- Ollama (LLM + embeddings) avec GPU et volume nommé: `ollama-models:/root/.ollama` (Option A retenue).
- Supabase: Postgres + pgvector + Storage + Edge Functions; RPC `match_documents`.
- Orchestrateur API local (remplace n8n): endpoints gelés V1 (voir PRD §20).
- RAG avec citations (metadata: notebook_id, source_id, loc.lines.from/to).

## 3) Invariants à respecter
- Contrats d’API V1 gelés (PRD §20): schémas de requête/réponse, erreurs, headers sécurité.
- Idempotence: `Idempotency-Key`, hashing des chunks, UNIQUE DB, locks.
- Observabilité: logs JSON avec `correlation_id`, `/health`, `/ready`.
- Sécurité: jamais exposer de secrets; utiliser variables d’environnement (SUPABASE_*, etc.).
- Perf initiales (ajustables): index 50 docs < 5–8 min; chat simple 3–5s, complexe 10–15s.

## 4) Environnement local
- Prérequis: Docker Desktop, WSL2, NVIDIA Container Toolkit.
- Lancement minimal: `docker-compose.yml` (service `ollama`, healthcheck via `ollama list`).
- Modèles Ollama persistés via volume nommé `ollama-models`.

Points d’attention Windows:
- Fin de ligne CRLF vs LF (Git peut réécrire). 
- Clé `version` dans compose est obsolète (warning inoffensif).
- Image Ollama ne contient pas `curl/wget` (utiliser `ollama list`).

## 5) Flux de travail recommandé pour l’IA
- Lire le contexte avant d’agir (PRD §20, plan, compose, INSTALLATION_CLONE).
- Utiliser le board de tâches `.taskmaster/tasks.json`:
  - Lister: `task-master list --with-subtasks -f .taskmaster/tasks.json`.
  - Prochaine: `task-master next -f .taskmaster/tasks.json`.
  - Mettre à jour: `task-master set-status --id <id> --status <state> -f .taskmaster/tasks.json`.
- Exécuter par petites étapes, avec checkpoints: 
  - Lotir les lectures, puis appliquer des modifications ciblées.
  - Après 3–5 actions ou >3 fichiers modifiés, faire un point rapide et planifier la suite.
- Valider après changements: lint/CI (pousser pour déclencher Actions), smoke tests (healthchecks), logs.

## 6) Branches, commits, PR
- Branche par fonctionnalité recommandée; `main` protégée si possible.
- Commits conventionnels (ex: `feat:`, `fix:`, `docs:`, `ci:`). 
- PR: description courte, tâches liées, checklist de tests.

## 7) CI/CD
- Actions: 
  - Markdown lint (`markdownlint-cli2`).
  - YAML lint (`yamllint`).
  - Vérification des liens docs (`lychee`).
- Fichiers: `.github/workflows/ci.yml`, `.markdownlint.json`, `.yamllint.yml`, `lychee.toml`.

## 8) Prochaines étapes (au 2025-08-10)
- Phase 2 terminée (compose + healthcheck ollama).
- Phase 3 à lancer: scaffolder l’Orchestrateur API minimal (FastAPI suggéré) avec:
  - `/health`, `/ready` + boot checks (dimensions embeddings=768, RPC Supabase, accès Storage, OLLAMA_BASE_URL).
  - Logs JSON + `correlation_id` et timeouts/retries.
  - Respect strict des contrats V1 (PRD §20).

## 9) Bonnes pratiques pour assistants IA
- Toujours citer les fichiers modifiés et limiter le diff à l’essentiel.
- Ne pas réécrire des sections inchangées; utiliser commentaires `...existing code...` si nécessaire.
- Ne pas inventer de chemins/APIs; vérifier avant d’affirmer.
- Éviter d’exécuter des commandes destructives sans sauvegarde/PR.
- Si bloqué par manque d’info: formuler 1–2 hypothèses raisonnables et continuer; poser 1 question ciblée si indispensable.

## 10) Dépannage rapide
- Ollama health "starting": vérifier healthcheck (`ollama list`) et logs du conteneur.
- GPU non détecté: vérifier NVIDIA Container Toolkit/WSL2.
- Warnings Task Master: s’appuyer sur `.taskmaster/config.json` ou préciser `-f`.
- Liens docs en échec CI: ajuster `lychee.toml` (exclusions, retries).

## 11) Glossaire / Liens
- Repo: https://github.com/KaizenCoder/notebooklm
- PRD: `docs/PRD.md`
- Plan: `projet_plan_de_dev_dataillee_v100.md`
- Compose: `docker-compose.yml`
- Tâches: `.taskmaster/tasks.json`
- CI: `.github/workflows/ci.yml`
