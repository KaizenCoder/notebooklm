# SPEC — Idempotency-Key (opérations d’ingestion)

Objectif: éviter les doublons lors d’appels répétés aux endpoints d’ingestion en utilisant l’en-tête `Idempotency-Key` et un stockage dédié (TTL, fingerprint, statut, réponse).

## Portée
- Endpoints concernés:
  - `POST /webhook/process-document` (202)
  - `POST /webhook/process-additional-sources` (200)
  - `POST /webhook/generate-audio` (202)
- Recommandé sur ces routes; si présent, DOIT être honoré.

## En-tête
- `Idempotency-Key`: UUID v4 recommandé (string opaque accepté).

## Stockage (schéma logique)
- idempotency_key: string (clé primaire logique)
- fingerprint: string (hash stable de {method, path, body_normalisé})
- status: enum("processing","succeeded","failed")
- response_status: number (HTTP)
- response_body: json (réponse renvoyée au client lors de `succeeded` ou `failed`)
- created_at, updated_at: timestamps
- expires_at: timestamp (TTL, par défaut 24h)

Notes:
- Le fingerprint permet de refuser la réutilisation d’une même clé pour une requête différente.
- Le stockage doit être transactionnel/atomique pour l’initialisation du statut `processing` (eviter races).

## Normalisation du fingerprint
Inclure: méthode HTTP, chemin, corps JSON trié par clés et sans champs volatils (ex: `timestamp`).
Exclure: en-têtes, `Authorization` et autres secrets.

## Sémantique par état
1) Première requête (aucune entrée):
   - Créer entrée { key, fingerprint, status: "processing" } atomiquement.
   - Exécuter l’opération normalement.
   - En fin d’exécution: stocker { status: "succeeded"|"failed", response_status, response_body }.

2) Rejeu pendant `processing`:
   - Retourner `409 Conflict` avec `ErrorResponse { code: IDEMPOTENCY_IN_PROGRESS }`.

3) Rejeu après `succeeded` (fingerprint identique):
   - Retourner la réponse persistée telle quelle: 200/202 selon l’endpoint, avec le même corps.

4) Rejeu après `failed` (fingerprint identique):
   - Retourner la réponse d’erreur persistée (même code HTTP et ErrorResponse).

5) Rejeu avec `Idempotency-Key` existante mais fingerprint différent:
   - Retourner `422 Unprocessable Entity` avec `ErrorResponse { code: IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST }`.

## Configuration
- TTL par défaut: 24h. Suggestion d’ENV: `IDEMPOTENCY_TTL_SECONDS` (optionnel; défaut 86400).
- Table/collection dédiée: index sur (idempotency_key).

## Erreurs types (ErrorResponse.code)
- `IDEMPOTENCY_IN_PROGRESS` → 409
- `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST` → 422
- `IDEMPOTENCY_STORAGE_UNAVAILABLE` → 500

## Tests attendus
- Rejeu identique → même réponse (200/202) et pas de duplications en DB/Storage.
- Rejeu différent → 422 `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST`.
- Rejeu en cours → 409 `IDEMPOTENCY_IN_PROGRESS`.
- Expiration TTL → nouvelle exécution possible après purge.

## Limitations
- La normalisation du corps doit être partagée côté serveur pour garantir un fingerprint stable.
- Les réponses 202 ne garantissent pas la complétion de l’arrière-plan; l’idempotence couvre l’acceptation initiale.

