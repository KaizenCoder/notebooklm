---
title: "Audit Generate‑Audio — Parité initiale"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [6]
scope: generate-audio
status: draft
version: 1.0
author: ia
related_files: ["../claims/EQUIPE3_CLAIMS_RESUBMIT.md", "../docs/spec/generate-audio.yaml"]
---

# Audit — Generate‑Audio (TTS, Storage, Callback)

#TEST: orchestrator/test/contract/generate-audio.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Vérifier la parité stricte de `/webhook/generate-audio` (202 + job, TTS local, upload bucket audio, MAJ `notebooks`, callback Edge).
- Décision: Tests contrat OK; implémentation réelle du pipeline à compléter.
- Points bloquants: TTS (Coqui) + upload storage + callback; transitions de statut et URL audio; idempotence.

## Références

- Spécifications: `docs/spec/generate-audio.yaml`, `docs/spec/openapi.yaml`
- Workflows originaux: `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main/supabase-functions/generate-audio-overview/index.ts`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: tests contractuels (generate‑audio, webhooks) avec DB/Jobs fakes.
- Procédure: `npm test` (offline); inspection route `/webhook/generate-audio`.
- ENVs: `NOTEBOOK_GENERATION_AUTH`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (optionnel pour callback), endpoints TTS/Storage locaux.

## Vérifications de parité

- HTTP: 202 Accepted immédiat (asynchrone) — conforme.
- DB: transitions `notebooks.audio_overview_generation_status` attendu `generating` -> `completed|failed`; set `audio_overview_url`.
- Storage: fichier audio en bucket `audio`, URL accessible en local.
- Callback: POST vers Edge `audio-generation-callback` avec `{ notebook_id, status, audio_url? }`.
- Logs/erreurs: erreurs contractuelles `{ code, message, details?, correlation_id }`.

## Résultats

- Observations: route renvoie 202; pas de job TTS/Storage/Callback câblé.
- Écarts détectés: manquent TTS, upload, MAJ DB, callback, idempotence/replays.

## Recommandations & décisions

- Actions requises: implémenter pipeline TTS (Coqui) + upload + MAJ notebook + callback; ajouter idempotence.
- Acceptation: conditionnelle après mise en conformité complète.

## Limitations

- Pas encore de tests d’intégration avec Storage/Coqui mocks; à ajouter.

## Suivi Task‑Master

- Tâches liées: 6.3 (SPEC), 6.4 (IMPL), 6.5 (TEST), 6.6 (AUDIT)
- Commandes:
  - `task-master set-status --id=6.4 --status=in-progress`
  - `task-master set-status --id=6.6 --status=review`

## Historique des versions

- v1.0: création du brouillon