# Spécifications OpenAPI de l'API Orchestrator

Ce répertoire contient la définition formelle et la "source de vérité" pour l'API de l'Orchestrateur, en utilisant la norme OpenAPI 3.0.

## Structure

L'architecture de ces spécifications est conçue pour être à la fois complète et modulaire :

1.  **`openapi.yaml` (Fichier Racine) :** C'est le point d'entrée principal de la documentation de l'API. Il contient les informations générales (version, description), la définition des serveurs, et les composants partagés comme les schémas de sécurité.

2.  **Fichiers de Chemin Individuels (`*.yaml`) :** Chaque fichier (ex: `chat.yaml`, `process-document.yaml`) contient la définition détaillée d'un seul endpoint (`path`). Ces fichiers sont ensuite référencés par le fichier racine `openapi.yaml` via la directive `$ref`.

## Utilisation

Pour visualiser l'intégralité de la spécification de l'API de manière interactive, utilisez un outil compatible avec OpenAPI en lui fournissant le fichier racine `openapi.yaml` comme point d'entrée.

**Outils recommandés :**
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- Extensions pour VS Code (ex: `Swagger Viewer`, `OpenAPI (Swagger) Editor`)

## Conventions

Pour maintenir la cohérence de l'API, les conventions suivantes sont appliquées :

- **Nommage (Naming) :** Les noms de champs dans les corps de requête/réponse JSON suivent la convention `snake_case` (ex: `session_id`).
- **Versioning :** Le versioning de l'API n'est pas inclus dans l'URL. La version est définie dans la section `info` de la spécification (`v1.0.0`).
- **Codes d'Erreur Standards :**
  - `400 Bad Request` : La requête du client est malformée, invalide ou des paramètres sont manquants. La réponse inclut un `ErrorResponse` détaillé.
  - `401 Unauthorized` : La clé d'API dans le header `Authorization` est manquante ou invalide.
  - `422 Unprocessable Entity` : La requête est sémantiquement correcte, mais le serveur ne peut pas la traiter (ex: une règle métier n'est pas respectée).
  - `500 Internal Server Error` : Une erreur inattendue est survenue côté serveur.

## Avantages de cette approche

- **Clarté :** Chaque endpoint est isolé dans son propre fichier, ce qui facilite sa lecture et sa maintenance.
- **Non-Répétition (DRY) :** Les éléments communs (comme la sécurité) sont définis une seule fois dans le fichier racine.
- **Automatisation :** Cette structure formelle permet d'automatiser la génération de documentation, de tests de conformité, et même de squelettes de code client/serveur.

## Conventions API

- En-têtes requis:
  - `Authorization`: clé partagée (voir `components.securitySchemes.ApiKeyAuth`).
  - `Idempotency-Key`: recommandé pour les opérations d’ingestion (ex.: `process-document`, `process-additional-sources`).
- Erreurs standardisées:
  - Réponses `400|401|422|500` suivent le schéma `ErrorResponse` avec `code`, `message`, `details?`, `correlation_id`.
  - Le `correlation_id` est propagé dans les logs pour la traçabilité.
- 202 (asynchrone):
  - `process-document`, `generate-audio`, `generate-notebook-content` répondent `202` avec `{ success, message }` (voir `SuccessResponse`).
  - Le traitement continue en arrière-plan; les callbacks sont gérés côté orchestrateur.
- Formats & schémas:
  - UUIDs (`format: uuid`) et timestamps ISO8601 (`format: date-time`).
  - Schémas communs: `Citation`, `SuccessResponse`, `ErrorResponse`, payloads additional-sources.
- Santé du service:
  - `GET /health`: vivacité minimale; `GET /ready`: dépendances (DB, Ollama, modèles, GPU) prêtes sinon `503`.
