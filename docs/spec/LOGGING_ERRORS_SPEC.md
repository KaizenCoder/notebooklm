# SPEC — Logging structuré & Modèle d’erreurs

Objectif: définir un format de logs JSON structuré, la propagation de `correlation_id`, la redaction des secrets, et l’usage cohérent du modèle `ErrorResponse` pour toutes les routes.

## Format de logs (JSON lines)
- Format: 1 ligne JSON par évènement.
- Champs recommandés:
  - level: "info"|"warn"|"error"
  - time: ISO8601 (`new Date().toISOString()`)
  - correlation_id: string (UUID) — généré à la réception de la requête si absent; propagé partout
  - service: "orchestrator"
  - route: string (ex: "/webhook/process-document")
  - method: "GET"|"POST"|...
  - status: number (HTTP)
  - duration_ms: number (latence de traitement de la requête)
  - event_code: string (ex: "EXTRACT_START", "EMBED_COMPLETE", "ERROR")
  - message: string (court et lisible)
  - details: object (clé/valeurs non sensibles)

Étapes à journaliser (exemples):
- process-document: EXTRACT_START/COMPLETE, CHUNK_START/COMPLETE, EMBED_START/COMPLETE, UPSERT_START/COMPLETE, CALLBACK_SENT
- chat: RAG_START/COMPLETE, MATCH_DOCS_START/COMPLETE
- generate-audio: TTS_START/COMPLETE, UPLOAD_START/COMPLETE, CALLBACK_SENT

## Propagation du correlation_id
- À la réception d’une requête: si un `correlation_id` est fourni en header (optionnel), l’utiliser; sinon en générer un (UUID v4).
- Inclure `correlation_id` dans tous les logs liés à la requête.
- Dans les réponses d’erreurs, inclure `correlation_id` dans l’objet `ErrorResponse` (voir OpenAPI).

## Redaction (secrets)
- Ne jamais logguer: valeurs d’ENVs, clés API, tokens, headers sensibles (ex: `Authorization`).
- Si un objet peut contenir des secrets, redacter les champs connus (ex: `authorization`, `password`, `api_key`) en `"[REDACTED]"`.

## Modèle d’erreurs (ErrorResponse)
- Schéma: `{ code: string, message: string, details?: object, correlation_id: string }`
- Mapping HTTP standard:
  - 400: `INVALID_REQUEST`, `TTS_INPUT_INVALID`, `IDEMPOTENCY_MISSING`
  - 401: `UNAUTHORIZED`
  - 403: `FORBIDDEN`
  - 422: `MODEL_NOT_FOUND`, `STORAGE_NOT_FOUND`, `DB_CONSTRAINT_VIOLATION`
  - 500: `DB_RPC_ERROR`, `OLLAMA_UNAVAILABLE`, `EMBED_DIM_MISMATCH`, `UPSTREAM_ERROR`, `TIMEOUT`
  - 503 (/ready): `GPU_NOT_AVAILABLE`, `DB_CONN_ERROR`, `OLLAMA_UNAVAILABLE`

Règles:
- Ne pas lancer d’erreurs non capturées; toujours retourner un `ErrorResponse` avec un `code` actionnable.
- Garder `message` lisible; mettre les détails techniques dans `details`.

## Métriques & latences (dans les logs)
- `duration_ms` au niveau requête.
- Étapes clés: `extract_duration_ms`, `embed_duration_ms`, `rag_duration_ms`, `tts_duration_ms` (dans `details`).

## Tests attendus
- #TEST: logs — présence `correlation_id` sur un appel nominal et en cas d’erreur.
- #TEST: erreurs — toutes les routes renvoient `ErrorResponse` contractuel (codes 400|401|403|422|500).
- #TEST: redaction — aucune valeur de `Authorization` logguée; champs sensibles redacts.

## Limitations
- La granularité exacte des `event_code` peut évoluer; conserver la stabilité des champs clés (`correlation_id`, `status`, `duration_ms`).

