---
title: "GPU-only enforcement (RAG & embeddings)"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [18]
scope: gpu-only
status: draft
version: 1.0
author: ia
related_files: ["orchestrator/src/services/ollama.ts","orchestrator/src/app.ts"]
---

# Audit — GPU-only enforcement (RAG & embeddings)

#TEST: orchestrator/test/e2e/chat-edge-send.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Valider l’enforcement GPU-only pour LLM et embeddings, conformément à `docs/TECHNICAL_GUIDELINES.md` (échec si CPU).
- Décision: En revue — contrôles présents (probe GPU Ollama + garde runtime), mais validation perf cible à compléter.
- Points bloquants: Confirmer refus explicite si device=CPU et couverture sur toutes routes RAG/ingestion.

## Références

- Spécifications: `docs/TECHNICAL_GUIDELINES.md`
- OpenAPI: `docs/spec/openapi.yaml`
- Workflows originaux: `docs/clone/`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: Scénarios health/ready, chat, ingestion (process-document/additional-sources), generate-audio.
- Procédure: Exécuter tests contractuels et E2E; inspecter logs d’étapes et headers `x-correlation-id`.
- Environnements/ENVs: Variables orchestrator, endpoints Ollama; GPU local requis.

## Vérifications de parité

- HTTP (statuts, payloads, entêtes): OK sur routes cibles; E2E chat OK.
- Side‑effects DB (tables, RPC `match_documents`): Non couvert par cet audit (hors périmètre GPU-only).
- Stockage (buckets, clés): N/A.
- Logs & erreurs (format contractuel): `correlation_id` présent; erreurs standardisées attendues si GPU indisponible.

## Résultats

- Observations: Présence d’un probe GPU côté Ollama et garde runtime (retour 503 attendu si GPU manquant). E2E passent en environnement local.
- Écarts détectés:
  - À confirmer: rejet explicite si device CPU pour toutes routes RAG/ingestion (chat, process-document, additional-sources).
  - Mesures de latence cibles non encore comparées à l’original.
- Captures/logs: voir sorties de `npm run -s test:contract` et `npm run -s test:e2e` (locaux).

## Recommandations & décisions

- Actions requises:
  - Ajouter un test contractuel simulant device=CPU → attendre 503 avec `ErrorResponse` standard.
  - Tracer un event clair `GPU_REQUIRED` en erreur.
  - Documenter le périmètre GPU-only (LLM/embeddings, pas TTS) dans `TECHNICAL_GUIDELINES.md`.
- Acceptation conditionnelle / Refus: Acceptation conditionnelle — passer en `done` après preuve du rejet CPU.

## Limitations

- Cet audit ne modifie pas les contrats; il constate l’écart GPU-only par rapport à l’original.

## Suivi Task‑Master

- Tâches liées: 18
- Commandes:
  - `task-master set-status --id=18 --status=review`

## Historique des versions

- v1.0: création de l’audit