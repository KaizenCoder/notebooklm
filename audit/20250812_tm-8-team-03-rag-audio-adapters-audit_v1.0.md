---
title: "Service adapters (Supabase/Ollama/Whisper/Coqui/Storage)"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [8]
scope: adapters
status: draft
version: 1.0
author: ia
related_files: [
  "orchestrator/src/services/supabase.ts",
  "orchestrator/src/services/ollama.ts",
  "orchestrator/src/services/audio.ts",
  "orchestrator/src/services/storage.ts"
]
---

# Audit — Service adapters (Supabase/Ollama/Whisper/Coqui/Storage)

#TEST: orchestrator/test/contract/webhooks.test.ts

## Résumé (TL;DR)

- Objet: Vérifier que les adaptateurs sont minces, mockables, et paramétrés par ENV, sans renommage.
- Décision: En revue — clients présents, injection et mocks OK; manque couverture mock Whisper et Storage avancée.
- Points bloquants: Compléter tests de mocks Whisper/Coqui/Storage selon mapping d’appels exact.

## Références

- Spécifications: `docs/TECHNICAL_GUIDELINES.md`
- OpenAPI: `docs/spec/openapi.yaml`
- Workflows originaux: `docs/clone/`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: Tests contractuels/mocks; inspection des fichiers de services et points d’injection.
- Procédure: Exécuter la suite contractuelle; vérifier endpoints issus des ENVs; contrôler absence de couplage fort.
- ENVs: Variables endpoints Supabase/Ollama/Whisper/Coqui/Storage.

## Vérifications de parité

- Interfaces et paramètres: Alignés avec original pour Supabase/Ollama; à compléter pour Whisper/Storage.
- Mocks et injection: Présents pour Supabase/Ollama; manquants/partiels pour Whisper/Storage.
- Erreurs/Timeouts: Politique résilience à vérifier (hors périmètre de cet audit, cf. tm-17).

## Résultats

- Observations: Clients présents; retry Ollama; stockage abstrait; audio synthèse couvrant TTS et upload.
- Écarts: Mocks Whisper/Storage partiels; ajouter tests ciblés d’erreurs/timeouts (en lien tm-17).
- Captures/logs: Sorties `npm run -s test:contract`.

## Recommandations & décisions

- Actions: Ajouter mocks Whisper + tests; compléter mocks Storage (upload/download); valider paramètres ENVs.
- Acceptation: Conditionnelle — passer en `done` après preuve tests mocks.

## Limitations

- Ne modifie pas les contrats; constate l’état vs original.

## Suivi Task‑Master

- Tâches liées: 8
- Commandes:
  - `task-master set-status --id=8 --status=review`

## Historique des versions

- v1.0: création de l’audit