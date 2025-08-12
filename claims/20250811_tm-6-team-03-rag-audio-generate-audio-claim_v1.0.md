---
title: "Generate‑Audio — Parité stricte (TTS + upload + callback)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: ["6", "6.3", "6.4", "6.5", "6.6"]
scope: generate-audio
status: draft
version: 1.0
author: ia
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/audio.ts
  - docs/spec/generate-audio.yaml
  - docs/WEBHOOKS_MAPPING.md
---

# Claim — Generate‑Audio — Parité stricte (TTS + upload + callback)

#TEST: orchestrator/test/contract/generate-audio.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

## Résumé (TL;DR)

- Problème constaté: la route `/webhook/generate-audio` répond 202 mais n’implémente pas encore l’intégralité du pipeline attendu (TTS local, upload, MAJ notebook, callback).
- Proposition succincte: implémenter un job asynchrone qui effectue TTS (Coqui, local), uploade dans le bucket `audio`, met à jour les champs notebook attendus (URL + expiry/status), et appelle le callback Edge avec le payload d’origine.
- Bénéfice attendu: parité 1:1 avec le package original, intégration FE/Edge stable et vérifiable.

## Contexte

- Contexte fonctionnel/technique: le frontend déclenche (via Edge Function) la génération d’un aperçu audio/podcast. L’orchestrateur doit réaliser la synthèse locale, stocker l’audio, mettre à jour l’état du notebook, et notifier l’Edge Function callback.
- Références: `docs/spec/generate-audio.yaml`, `docs/WEBHOOKS_MAPPING.md`, `docs/ANNEXES_PAYLOADS.md`, `docs/clone/...`

## Portée et périmètre (scope)

- Équipe: team-03 / rag-audio
- Tâches Task‑Master visées: 6 (et sous‑tâches 6.3 SPEC, 6.4 IMPL, 6.5 TEST, 6.6 AUDIT)
- Endpoints/domaines: generate-audio

## Demande et motivation

- Description détaillée de la revendication:
  - La route `/webhook/generate-audio` doit:
    1) Répondre immédiatement `202` (asynchrone), mettre `audio_overview_generation_status = generating`.
    2) En job: réaliser la TTS (Coqui local) sur le texte associé; uploade l’audio généré dans le bucket `audio` (Storage local)
    3) Mettre à jour le notebook: `audio_overview_url`, `audio_url_expires_at`, `audio_overview_generation_status = completed|failed`.
    4) Appeler le callback Edge (`callback_url`) avec `{ notebook_id, status: 'success'|'failed', audio_url? }`.
  - Supporter `Idempotency-Key` pour éviter les doublons de génération.
- Justification: parité stricte avec l’original; fiabilité et traçabilité du flux audio.

## Critères d’acceptation

- [ ] CA1: l’appel POST `/webhook/generate-audio` (payload conforme OpenAPI) retourne `202` et positionne le statut `generating`.
- [ ] CA2: en succès, l’audio est généré et stocké; le notebook a `audio_overview_url`+`audio_url_expires_at` mis à jour; `completed` est persisté.
- [ ] CA3: le callback est invoqué avec `{ notebook_id, status: 'success', audio_url }` (et `failed` en cas d’erreur).
- [ ] CA4: avec `Idempotency-Key` identique, l’appel répété ne recrée pas de job; on renvoie la même réponse d’acceptation.

## Impacts

- API/Contrats I/O: aucun changement; application stricte de `docs/spec/generate-audio.yaml`.
- Code & modules: `orchestrator/src/app.ts` (route + job), `orchestrator/src/services/audio.ts` (TTS), futur adaptateur Storage local (upload), DAO notebook pour MAJ champs.
- Schéma/DB/Storage: bucket `audio` (Storage local) avec URLs signées; champs notebook pour lien + expiry + status.
- Performance/latences: TTS local dépendant du matériel; asynchrone et tolérant.
- Sécurité/compliance: pas d’exposition de secrets; callback Edge via URL fournie; storage local uniquement.

## Risques et alternatives

- Risques: indisponibilité TTS/Storage local pendant le job; corruption de fichier audio.
- Atténuations: timeouts/retries (best‑effort), validations de taille/format, journalisation par étapes.
- Alternatives: TTS mock en dev (déjà en place), bascule vers moteur TTS alternatif local si besoin.

## Références

- Spécifications: `docs/spec/generate-audio.yaml`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Limitations

- Ce document n’introduit aucune exigence hors parité avec l’original.
- Les métriques chiffrées sont indicatives et non contractuelles.

## Suivi Task‑Master

- Tâches liées: 6, 6.3, 6.4, 6.5, 6.6
- Commandes:
  - `task-master set-status --id=6.4 --status=in-progress`
  - `task-master set-status --id=6.4 --status=review`

## Historique des versions

- v1.0: création du claim 