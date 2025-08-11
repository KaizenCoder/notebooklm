# Guide d'Onboarding pour les IA

Bienvenue dans le projet de clonage de **InsightsLM Local**. Ce guide vous expliquera tout ce que vous devez savoir pour devenir rapidement un membre productif de l'équipe.

## Mission Principale

Notre objectif est de créer un clone avec **parité stricte** de l'application originale en remplaçant le composant `n8n` par une API Orchestrator sur mesure. La règle d'or est la fidélité au projet original : nous ne réinventons rien, nous remplaçons et nous répliquons.

## Philosophie du Projet : "Task-Master OS"

Ce projet est entièrement piloté par l'outil `task-master`. Notre devise est : **"Pas de tâche, pas de travail."**

Toute action, de la spécification à la validation, est une tâche tracée. `task-master` n'est pas un outil de suivi, il **est** le plan, le processus et la source de vérité sur l'avancement du projet.

---

## Étape 1 : Phase de Lecture (Obligatoire)

Avant toute chose, vous devez lire et comprendre les documents de cadrage suivants. Ils ne sont pas optionnels.

1.  **`DEVELOPMENT_PLAN.md`** : Pour comprendre la stratégie d'exécution, les grandes phases et l'ordre dans lequel les fonctionnalités seront développées.
2.  **`docs/PRD.md`** : Vision produit, exigences, gouvernance Implémenteur/Auditeur.
3.  **`docs/GOUVERNANCE.md`** : Règles du binôme, Task‑Master OS, revues de parité.
4.  **`docs/TECHNICAL_GUIDELINES.md`** : Règles techniques impératives (GPU‑only, idempotence, timeouts, santé).
5.  **`docs/spec/openapi.yaml`** et `docs/spec/README.md` : Source de vérité des contrats d’API.
6.  **`docs/PARITY_REVIEW_CHECKLIST.md`** et **`docs/DECISIONS.md`** : Rituel de parité hebdomadaire et journal des décisions.

## Étape 2 : Configuration de l'Environnement

Notre environnement est entièrement conteneurisé pour garantir l'uniformité.

1.  **Clonez le dépôt** sur votre environnement local.
2.  **Copiez le fichier d'environnement** : `cp .env.example .env`. Remplissez les quelques variables manquantes si nécessaire (pour un développement local, la plupart des valeurs par défaut devraient suffire).
3.  **Lancez l'environnement (infra Compose à venir)** : le fichier `docker-compose.yml` sera livré via les tâches d’infra (voir `.taskmaster/tasks.json`, ex.: tâches 14/15/16/17/18). En attendant, assurez les services locaux minimums:
    - PostgreSQL locale (avec pgvector) accessible via `POSTGRES_DSN`.
    - Ollama opérationnel (réseau Docker interne), variable `OLLAMA_BASE_URL` configurée.
4.  **Installez les dépendances locales** : Si ce n'est pas déjà fait, installez `task-master` globalement : `npm i -g task-master`.
5.  **Variables d’environnement minimales (exemple)** :
    - `POSTGRES_DSN=postgres://user:pass@postgres:5432/dbname`
    - `OLLAMA_BASE_URL=http://ollama:11434`
    - `NOTEBOOK_GENERATION_AUTH=changeme` (secret pour le header `Authorization`)
    - (optionnel) `STORAGE_BASE_URL=...` selon votre setup local
    Reportez‑vous à `docs/spec/README.md` et `docs/TECHNICAL_GUIDELINES.md`.

Votre environnement est maintenant prêt.

## Étape 3 : Votre Rôle et Votre Première Tâche

Ce projet fonctionne avec des **duos d'IA : un Implémenteur et un Auditeur.**

-   **L'Implémenteur** code et teste (`IMPL`, `TEST`).
-   **L'Auditeur** spécifie et valide la parité (`SPEC`, `AUDIT`).

Votre première action en tant qu'IA est de vous situer :

1.  **Consultez l'état du projet** :
    ```bash
    task-master list --with-subtasks
    ```
2.  **Identifiez votre rôle** (vous serez assigné à un duo) et les tâches qui vous concernent.
3.  **Comprenez le flux** : Une tâche `IMPL` ou `TEST` ne peut commencer que si la tâche `SPEC` correspondante est `done`. Une tâche `AUDIT` ne peut commencer que si les tâches `IMPL` et `TEST` sont en `review`.

## Étape 4 : Le Cycle de Travail Quotidien

Votre routine de travail doit suivre ce cycle pour garantir la traçabilité et la cohérence.

1.  **Synchronisez votre code** : `git pull origin main` (ou la branche principale).
2.  **Identifiez votre prochaine tâche** : `task-master next` ou `task-master list --status pending`.
3.  **Prenez la tâche en charge** : `task-master set-status --id <ID_TÂCHE> --status in-progress`.
4.  **Créez une branche de travail** : Le nom de la branche doit inclure l'ID de la tâche. `git checkout -b feature/TM-<ID_TÂCHE>-description-courte`.
5.  **Développez et testez** : Implémentez le code et les tests de parité associés.
6.  **Commitez votre travail** : Chaque commit doit référencer l'ID de la tâche. `git commit -m "TM-<ID_TÂCHE>: Description de la modification"`.
7.  **Soumettez pour l'audit** : Poussez votre branche (`git push`) et créez une Pull Request. Mettez ensuite votre tâche en attente de revue : `task-master set-status --id <ID_TÂCHE> --status review`.

L'Auditeur prendra alors le relais.

## Règles d'Or

- **La Parité est Reine** : En cas de doute, le comportement du code dans `docs/clone/` est la seule et unique vérité.
- **Task-Master est la Loi** : Pas de code sans tâche. Pas de commit sans référence à une tâche.
- **La Documentation est le Contrat** : Les spécifications (`docs/spec/`) et les guides techniques (`docs/TECHNICAL_GUIDELINES.md`) ne sont pas des suggestions, ce sont des exigences.

---

## Pré‑requis Techniques & ENV
- Base de données: PostgreSQL locale avec pgvector (obligatoire). Supabase est autorisé uniquement en local et DOIT pointer sur cette base.
- ENVs clés: `POSTGRES_DSN`, `OLLAMA_BASE_URL`, `NOTEBOOK_GENERATION_AUTH` (obligatoire), variables Storage locales (si utilisées).
- En‑têtes API: `Authorization: ${NOTEBOOK_GENERATION_AUTH}` (toutes les routes), `Idempotency-Key` recommandé pour les ingestions.

## Vérifications Santé & GPU
- Endpoints: `GET /health` (vivacité), `GET /ready` (DB/Ollama/modèles/GPU prêts; sinon 503).
- GPU‑only: toute IA (embeddings/LLM) doit s’exécuter sur GPU. Vérifier via un embedding court et refuser tout fallback CPU (voir `docs/TECHNICAL_GUIDELINES.md`).

## Sécurité & Réseau
- Orchestrateur accessible uniquement sur le réseau interne Docker (pas d’exposition de port hôte).
- Ne pas logguer de secrets; logs JSON structurés avec `correlation_id`.

## Parité Hebdomadaire
- Exécuter la revue de parité hebdo (check‑list `docs/PARITY_REVIEW_CHECKLIST.md`).
- Consigner tout écart/choix dans `docs/DECISIONS.md` avec IDs Task‑Master.

## Frontend & Mocks
- Le frontend progresse via mocks contractuels (SPEC OpenAPI) tant que les webhooks ne sont pas prêts.
- Respecter strictement les shapes/réponses documentées.

## Modèle d’Erreur & Idempotence
- Erreurs: réponse standard `{ code, message, details?, correlation_id }` avec statuts `400|401|422|500`.
- Idempotence: utiliser `Idempotency-Key` et un stockage (TTL, fingerprint) pour éviter la duplication en ingestion.

## Références Claims & Audits (Obligatoire)

- Lire `docs/DOCUMENTATION_PROJET.md` — section "Claims & Audits (processus et conventions)".
- Répertoires: `claims/` (demandes) et `audit/` (vérifications).
- Templates:
  - Claim: `claims/TEMPLATE_CLAIM.md`
  - Audit: `audit/TEMPLATE_AUDIT.md`
- Nommage (résumé):
  - Claims: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-claim[_resubmit-<n>]_v<maj.min>.md`
  - Audits: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-audit_v<maj.min>.md`
- Front‑matter YAML requis: `title, doc_kind, team, team_name, tm_ids, scope, status, version, author, related_files`.
- Exigences de conformité:
  - Inclure au moins une ligne `#TEST:` pointant vers des preuves (tests, logs, artefacts)
  - Inclure la section `## Limitations` dans chaque document
- Rappel gouvernance:
  - Flux Task‑Master: SPEC → IMPL → TEST → AUDIT
  - Ne pas mettre le statut dans le nom de fichier; l’indiquer dans le front‑matter
- Validation automatique:
  - Exécuter: `node scripts/validate-claims-audit.mjs` avant commit/PR; corriger toute violation signalée (#TEST manquants, Limitations, front‑matter, nommage).
