# LLM inopérant et gel de l'orchestrateur (DB/Ollama) — RCA et correctif (2025-08-13)

## Résumé
- Problème initial : le LLM ne fonctionnait pas dans le projet — l'orchestrateur ne détectait aucun modèle Ollama et ne générait pas de réponses.
- Symptômes connexes : l'orchestrateur échoue aux vérifications de démarrage (erreurs d'auth DB), puis modèles Ollama signalés manquants ; plus tard, impossible d'écouter sur le port 8000.
- Causes racines :
  - Erreur de configuration PostgreSQL (`host_auth_method` invalide) et divergences de nom de base/mot de passe.
  - Conflits de ports hôte : service PostgreSQL Windows lié à 5432 ; une autre appli liée à 8000.
  - Écarts d'environnement : `localhost` vs `127.0.0.1` pour Ollama ; décalage d'étiquette de modèle (`nomic-embed-text` vs `nomic-embed-text:latest`).
- Résultat : tous les services sont alignés ; l'orchestrateur démarre et écoute sur 8080 ; vérifications DB/Ollama OK.

## Symptômes
- LLM inopérant : aucune réponse générée par l'orchestrateur ; appels à l'API Ollama via `localhost` renvoyant une liste vide de modèles ; interface/service marquant les modèles comme manquants.
- DB : `FATAL: password authentication failed for user "notebook"` et `database "notebooklm" does not exist`.
- Postgres ne démarre pas avec : `unrecognized configuration parameter "host_auth_method"`.
- Orchestrateur : « Ollama models: MISSING » alors que les modèles sont présents.
- Erreur d'écoute serveur : `EACCES: permission denied 0.0.0.0:8000`.

## Analyse des causes racines
1. PostgreSQL
   - Paramètre invalide `host_auth_method` dans `postgresql.conf` bloquant le démarrage.
   - Incohérence de nom de base entre compose, healthcheck et DSN de l'app (ex. `notebooklm` vs `agent_memory_notebooklm`).
   - Décalage de mot de passe dû à l'usage mixte secrets vs clair.
   - Port hôte 5432 déjà occupé par le service Windows `postgresql-x64-17`, rendant la connectivité ambiguë.
2. Ollama
   - `localhost` renvoyait une liste vide pour le process Node alors que `127.0.0.1` listait les modèles.
   - La précédence des variables d'env permettait à l'environnement hôte d'écraser le `.env`.
   - Étiquette du modèle d'embedding nécessitant `:latest`.
3. Orchestrateur
   - Le port 8000 était déjà lié par un process `Manager` entraînant un EACCES à l'écoute.

## Stratégie de correction (appliquée)
1. PostgreSQL
   - Suppression de `host_auth_method` dans `infra/config/postgresql/postgresql.conf`.
   - `infra/config/postgresql/pg_hba.conf` autorise md5 pour les connexions réseau.
   - Unification du nom de base et des identifiants : base `agent_memory_notebooklm`, user `notebook`, mot de passe `notebook`.
   - Déport de la publication pour éviter le conflit : `55432:5432` dans `infra/docker-compose.yml`.
   - Réinitialisation du mot de passe de l'utilisateur dans le conteneur et vérification de l'auth TCP.
2. Alignement d'environnement
   - DSN homogène partout : `postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm` dans les `.env`.
   - Forcer le chargement du `.env` à écraser l'env hôte via `config({ override: true })` dans `src/env.ts`.
3. Configuration Ollama
   - Utilisation de `OLLAMA_BASE_URL=http://127.0.0.1:11434` (et non `localhost`).
   - Normalisation des étiquettes installées : `nomic-embed-text:latest` et `phi3:mini`.
4. Port de l'orchestrateur
   - Passage à `PORT=8080` dans `orchestrator/.env` pour éviter le conflit sur 8000.

## Fichiers modifiés
- `infra/docker-compose.yml` : publication de Postgres sur 55432 ; env et healthcheck cohérents.
- `infra/config/postgresql/postgresql.conf` : suppression du paramètre invalide ; réglages de base.
- `infra/config/postgresql/pg_hba.conf` : md5 pour les connexions (IPv4/IPv6).
- `infra/postgres/init/01-init-db.sh` : création de l'extension pgvector, schéma et droits ; garantie du mot de passe.
- `.env` et `orchestrator/.env` : DSN, `OLLAMA_BASE_URL`, modèles et `PORT=8080` unifiés.
- `orchestrator/src/env.ts` : `dotenv` charge désormais avec `{ override: true }`.

## Vérifications
1. Santé Postgres
   - Conteneur : Up (healthy). Mappage `0.0.0.0:55432->5432/tcp`.
   - Test d'auth TCP :
     - Depuis l'hôte : `psql "postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm" -c "select 1;"`
2. Modèles Ollama
   - API : `GET http://127.0.0.1:11434/api/tags` montre `phi3:mini` et `nomic-embed-text:latest`.
3. Démarrage orchestrateur
   - Logs : `DB connection: OK`, `Ollama models: OK`, `GPU probe: OK`.
   - Écoute : `http://0.0.0.0:8080`.
4. Tests fumigènes
   - Health : `GET http://127.0.0.1:8080/health` → `{ status: 'ok' }`.
   - Ready : `GET http://127.0.0.1:8080/ready` (modèles installés requis).

## Notes opérationnelles
- Préférer `127.0.0.1` à `localhost` pour Ollama afin d'éviter des incohérences de résolution.
- Si vous devez utiliser les ports standard (5432/8000), arrêter les services/processus Windows en conflit ou changer leurs ports :
  - Service Postgres Windows : `postgresql-x64-17`.
  - Processus sur 8000 : `Manager` (PID variable).
- Garder le nom de base cohérent entre compose, scripts d'init, healthchecks et DSN.
- En cas d'usage de secrets Docker pour le mot de passe DB, s'assurer que l'app consomme la même valeur (ou l'injecter au runtime).

## Checklist de reprise rapide
- Postgres
  - [ ] `docker-compose ps` affiche postgres en healthy
  - [ ] L'auth TCP `psql` fonctionne vers la base et l'utilisateur attendus
  - [ ] Le mappage de port ne crée pas de conflit sur l'hôte
- Env
  - [ ] Le DSN de `orchestrator/.env` pointe vers 127.0.0.1:55432/agent_memory_notebooklm
  - [ ] `src/env.ts` utilise `config({ override: true })`
- Ollama
  - [ ] La base URL est 127.0.0.1:11434
  - [ ] Les modèles installés correspondent aux étiquettes d'env (ex. `nomic-embed-text:latest`)
- Orchestrateur
  - [ ] Le PORT n'est pas occupé (nous utilisons 8080)
  - [ ] `/health` et `/ready` renvoient OK

## Commandes (PowerShell)
```powershell
# État de Postgres
cd .\infra
docker-compose ps

# Tester l'auth DB depuis l'hôte
psql "postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm" -c "select 1;"

# Lister les modèles Ollama
Invoke-RestMethod -Uri http://127.0.0.1:11434/api/tags | ConvertTo-Json -Depth 4

# Vérifier les ports utilisés
Get-NetTCPConnection -LocalPort 5432,8000 -State Listen | Format-Table -AutoSize

# Démarrer l'orchestrateur
cd ..\orchestrator
npm run build
node dist/index.js
```

---
Préparé par : Team Orange — Impl
Date : 2025-08-13
