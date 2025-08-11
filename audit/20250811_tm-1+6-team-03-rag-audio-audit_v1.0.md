---
title: "Audit RAG & Audio — Parité initiale"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [1, 6, 10, 15]
scope: chat|generate-audio|logging
status: draft
version: 1.0
author: ia
related_files: ["../claims/20250811_tm-1+6-team-03-rag-audio-claim_v1.0.md"]
---

# Audit — RAG & Audio (Chat, Generate‑Audio)

#TEST: orchestrator/test/contract/*.test.ts
#TEST: orchestrator/test/integration/*.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Vérifier la parité stricte pour `/webhook/chat` (RAG + citations + persistance) et `/webhook/generate-audio` (TTS + stockage + callback).
- Décision: Suite de tests contrat/intégration verte; parité partielle. Corrections requises pour persistance `n8n_chat_histories`, citations `loc.lines`, pipeline TTS + upload + callback, erreurs JSON uniformisées et idempotence.
- Points bloquants: Implémentation réelle `generate-audio` (au‑delà du 202 placeholder); mapping citations avec `metadata.loc.lines`; uniformisation ErrorResponse + `correlation_id`.

## Références

- Claim associé: `claims/EQUIPE3_CLAIMS_RESUBMIT.md`
- Spécifications: `docs/spec/chat.yaml`, `docs/spec/generate-audio.yaml`, `docs/spec/openapi.yaml` (ErrorResponse)
- Workflows originaux: `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main` (Supabase functions), `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: tests contractuels fournis (chat strict, chat integration, chat persist, generate‑audio, webhooks); mocks Supabase/Ollama/DB/Jobs.
- Procédure: exécution locale offline via `npm test`; vérification des shapes HTTP et side‑effects simulés.
- Environnements/ENVs: `NOTEBOOK_GENERATION_AUTH`, `OLLAMA_BASE_URL`, (optionnels) `OLLAMA_LLM_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Vérifications de parité

- HTTP (statuts, payloads, entêtes):
  - Chat: 200 OK, compat payload strict et `{ messages: [...] }`; Auth 401 si manquant/incorrect.
  - Generate‑audio: 202 Accepted (asynchrone) — conforme au contrat de base.
- Side‑effects DB (tables, RPC `match_documents`):
  - Chat: insertions effectuées via `insertMessage` (placeholder), RPC `match_documents` mocké.
  - Attendu: `n8n_chat_histories` avec shape d’origine; citations basées sur `documents.metadata.loc.lines`.
- Stockage (buckets, clés):
  - Generate‑audio: callback/URL simulés; stockage réel non câblé.
- Logs & erreurs (format contractuel):
  - Logs JSON présents; modèle d’erreurs contractuel non encore uniformisé (ErrorResponse + `correlation_id`).

## Résultats

- Observations:
  - Suite de tests PASS (contrat/intégration).
  - Handler `/webhook/chat` privilégie `messages`; payload strict accepté mais peu exploité (session_id/user_id/timestamp).
  - `/webhook/generate-audio` renvoie 202 mais le pipeline TTS/Storage/MAJ/Callback reste à implémenter.
- Écarts détectés:
  - Persistance chat dans `n8n_chat_histories` manquante.
  - Citations sans `loc.lines.from/to`.
  - Erreurs non normalisées (ErrorResponse), pas de `correlation_id`.
  - Idempotence absente sur ingestion/génération.
- Captures/logs: voir sortie `npm test` locale.

## Recommandations & décisions

- Actions requises:
  - Chat: persister dans `n8n_chat_histories` (2 entrées user/assistant); exploiter `session_id` pour filtrage RAG; construire `citations` avec `loc.lines` depuis `documents`.
  - Generate‑audio: implémenter TTS (Coqui), upload vers bucket `audio`, MAJ `notebooks`, exécuter callback Edge; ajouter idempotence.
  - Erreurs: ajouter middleware ErrorResponse uniforme avec `correlation_id`; couvrir 400/401/422/500.
  - Idempotence: activer `Idempotency-Key` sur `/webhook/process-document` et `/webhook/generate-audio`.
- Acceptation conditionnelle / Refus:
  - Acceptation conditionnelle sous réserve de mise en conformité des points ci‑dessus.

## Limitations

- Audit basé sur tests locaux contractuels/intégration; pas encore d’E2E réel avec Edge Functions + Storage local. Les scénarios E2E seront couverts dans les tâches TEST/AUDIT associées.

## Suivi Task‑Master

- Tâches liées: 1 (chat), 6 (generate‑audio), 10 (logging & errors), 15 (idempotence)
- Commandes:
  - Lancer SPEC generate‑audio: `task-master set-status --id=6.3 --status=in-progress`
  - Soumettre à revue (après corrections):
    - `task-master set-status --id=1.7 --status=review`
    - `task-master set-status --id=6.6 --status=review`

## Historique des versions

- v1.0: création du brouillon d’audit (parité initiale)
