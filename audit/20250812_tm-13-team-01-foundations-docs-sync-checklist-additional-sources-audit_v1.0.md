---
title: "Checklist de Parité — process-additional-sources (Edge Functions vs Orchestrator)"
doc_kind: audit
team: team-01
team_name: foundations
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [13]
scope: docs
related_files:
  - docs/clone/insights-lm-public-main/insights-lm-public-main/supabase/functions/process-additional-sources/index.ts
  - docs/spec/process-additional-sources.yaml
  - orchestrator/src/app.ts
---

#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts

## Parité des payloads (ligne-à-ligne)

- multiple-websites (source Edge):
  - type: "multiple-websites" — OK
  - notebookId: string (uuid) — OK
  - urls: string[] (uri) — OK
  - sourceIds: string[] (uuid), correspondance 1‑to‑1 avec `urls` — OK
  - timestamp: string (ISO) — accepté/transmis — OK (accepté, non strictement requis côté Orchestrator)

- copied-text (source Edge):
  - type: "copied-text" — OK
  - notebookId: string (uuid) — OK
  - title: string — accepté mais non exploité par l’indexation — OK (pas d’impact backend)
  - content: string — OK (indexation `txt`)
  - sourceId: string (uuid) — OK (Edge envoie `sourceIds?.[0]`, Orchestrator accepte `sourceId`)
  - timestamp: string (ISO) — accepté — OK

## Contrats et réponses
- Auth: header `Authorization: NOTEBOOK_GENERATION_AUTH` — OK
- Méthode: POST — OK
- Réponse 200 avec `{ success, message, webhookResponse }` — OK (messages conformes à l’original)
- 4xx/5xx: schéma `ErrorResponse` — OK

## Notes et adaptations (non‑écarts)
- `title` (copied-text): non nécessaire à l’indexation; conservé en payload pour parité, non utilisé côté backend — conforme à la doc projet (pas un écart).
- `timestamp`: champ optionnel côté backend — accepté/transmis sans validation stricte — conforme (pas un écart).
- Upload `.txt` simulé (orchestrator) pour parité fonctionnelle avec le flux d’origine (stockage) — adaptation conforme au clone local.

## Limitations
- Conversion HTML→texte (multiple-websites) simulée; parité de rendu à confirmer ultérieurement contre le pipeline d’origine (n8n/Edge).
