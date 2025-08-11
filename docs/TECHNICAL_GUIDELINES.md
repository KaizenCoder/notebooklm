# Guide d'Implémentation Technique & Exigences Non-Fonctionnelles

Ce document centralise les exigences techniques, de performance, de robustesse et de sécurité pour l'API Orchestrator. Il sert de référence pour toutes les tâches d'implémentation et d'audit gérées dans `task-master`.

## 1. Cibles de Performance et Utilisation des Ressources

### Cibles Indicatives

Ces cibles sont à utiliser comme des objectifs pour guider l'optimisation :

- **Indexation d'un document PDF (~50 pages) :** Doit être complétée en moins de 5 à 8 minutes.
- **Latence du Chat (RAG) - Requête simple :** Réponse en moins de 3 à 5 secondes.
- **Latence du Chat (RAG) - Requête complexe :** Réponse en moins de 10 à 15 secondes.

### Contrainte Fondamentale : Exécution GPU Stricte

> **L'exigence "GPU-only, sans fallback CPU" est une contrainte fondamentale et non-négociable du projet.**

Toutes les tâches d'intelligence artificielle (embeddings, génération LLM, etc.) **DOIVENT** s'exécuter exclusivement sur GPU. Aucun mécanisme de fallback sur le CPU n'est autorisé. La configuration de l'environnement (Docker) et les vérifications de santé de l'API doivent garantir et valider cette contrainte de manière systématique.

## 2. Robustesse et Fiabilité de l'API

L'API doit être conçue pour être résiliente et prévisible.

- **Idempotence :** Toutes les opérations d'ingestion (création de ressource) exposées via les webhooks DOIVENT supporter une clé d'idempotence. La méthode privilégiée est l'utilisation d'un en-tête HTTP `Idempotency-Key`.
- **Timeouts & Retries :** Les appels aux services externes (Ollama, Coqui, Whisper) doivent implémenter des timeouts raisonnables. En cas d'erreur réseau ou de service temporairement indisponible, une stratégie de "retry" avec backoff exponentiel doit être mise en place (ex: 2 tentatives max).
- **Gestion des Erreurs :** L'API ne doit jamais crasher. Elle doit capturer les erreurs et retourner des réponses JSON structurées et informatives, incluant un code d'erreur interne et un message clair.

## 3. Démarrage et Vérifications de Santé ("Sanity Checks")

Pour éviter les erreurs à l'exécution, l'API doit valider son environnement au démarrage et exposer son état.

- **Endpoint `/health` :** Un endpoint `GET /health` doit être disponible pour vérifier l'état de l'API.
- **Vérifications au Démarrage (Fail Fast) :** Au lancement, avant de pouvoir servir des requêtes, l'API DOIT :
  1.  Valider la présence et le format de toutes les variables d'environnement requises.
  2.  Vérifier la connectivité à la base de données PostgreSQL locale.
  3.  Vérifier la connectivité au service Ollama (`OLLAMA_BASE_URL`).
  4.  Confirmer que les modèles d'IA requis (ex: `nomic-embed-text`) sont disponibles via l'API d'Ollama.
  - En cas d'échec d'une de ces vérifications, l'API doit s'arrêter avec un message de log explicite.

## 4. Choix d'Implémentation et Conventions

Pour garantir la parité et la qualité, les conventions suivantes sont à respecter.

- **Extraction PDF :** L'extraction de texte depuis les PDF doit être réalisée en utilisant une librairie de l'écosystème Node.js/TypeScript (ex: `pdf-parse`) pour maintenir la parité avec la stack technique du projet original.
- **Chunking :** La taille des chunks et leur chevauchement (overlap) doivent être configurables. La valeur par défaut est une taille de ~200 tokens avec un overlap. La structure `metadata` de chaque chunk doit impérativement contenir les numéros de ligne d'origine (`loc.lines.from`, `loc.lines.to`) pour assurer la précision des citations.
- **Embeddings :** Les embeddings doivent être générés en "batchs" (lots) pour optimiser les performances avec Ollama.

## 5. Sécurité

- **Isolation Réseau :** L'API Orchestrator doit uniquement être accessible depuis le réseau interne de Docker. Elle ne doit pas exposer de port sur la machine hôte.
- **Authentification :** Chaque appel de webhook doit être authentifié via le header `Authorization` contenant le secret partagé (`NOTEBOOK_GENERATION_AUTH`).

## 6. Journalisation (Logging) & Observabilité

- **Logs Structurés :** Tous les logs doivent être au format JSON.
- **Traçabilité :** Chaque requête reçue par l'API doit se voir assigner un `correlation_id` unique, qui doit être présent dans tous les logs relatifs à cette requête. Cela permet de suivre le parcours complet d'une opération.
- **Métriques de Latence :** Le temps de traitement des étapes clés (ex: `extract_duration`, `embed_duration`, `rag_duration`) doit être journalisé pour identifier les goulots d'étranglement.

## Références Claims & Audits

- Voir `docs/DOCUMENTATION_PROJET.md` — section "Claims & Audits (processus et conventions)".
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
- Validation automatique:
  - `node scripts/validate-claims-audit.mjs` — à lancer avant commit/PR

#TEST: docs/spec/README.md
