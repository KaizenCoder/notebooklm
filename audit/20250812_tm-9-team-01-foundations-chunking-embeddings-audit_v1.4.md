---
title: "Foundations — Chunking + embeddings (768)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [9]
scope: chunking
status: draft
version: 1.4
author: ia
related_files: ["orchestrator/src/services/document.ts", "orchestrator/test/contract/chunking-overlap-dims.test.ts", "orchestrator/test/contract/chunking-overlap-metadata.test.ts", "orchestrator/test/contract/chunking-loc-lines-repeats.test.ts"]
---

# Audit — Foundations — Chunking + embeddings (768)

#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts
#TEST: orchestrator/test/contract/chunking-overlap-metadata.test.ts
#TEST: orchestrator/test/contract/chunking-loc-lines-repeats.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Vérifier la parité du découpage (~200 tokens, overlap 40) et des métadonnées `loc.lines.from/to` ainsi que l’enforcement des embeddings 768d.
- Décision: Conforme en lecture de code; exécution non effectuée (environnement sans installation).
- Points bloquants: Validation dynamique des tests non réalisée (toolchain Windows dans `node_modules`, installation interdite).

## Références

- Spécifications: `docs/spec/CHUNKING_SPEC.md`, `docs/spec/IDEMPOTENCY_SPEC.md` (timings), `docs/spec/README.md`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Lecture du code: `orchestrator/src/services/document.ts` (fonction `chunkTokens`, `processDocument`).
- Lecture des tests: `chunking-*.test.ts` pour critères attendus (overlap 40, dims=768, métadonnées loc.lines, monotonie `to`).
- Aucune exécution de tests ni dépendances installées.

## Vérifications de parité

- Découpage: `chunkTokens(text, 200, 40)` découpe par mots (split whitespace), overlap 40 tokens, progression par fenêtre glissante — conforme à l’esprit de la spec (~200/40).
- Mapping lignes: construction d’un index `tokenLine[]` pour mapper indices tokens → numéros de lignes; `from`=`tokenLine[start]`, `to`=`tokenLine[end-1]` — cohérent avec `loc.lines.from/to` attendu par le clone.
- Embeddings: appel `ollama.embeddings` sous `env.OLLAMA_EMBED_MODEL`; enforcement strict `if (vec.length !== 768) throw` puis fallback `[]` catché — respecte la contrainte 768d.
- Métadonnées: `metadata: { notebook_id, source_id, loc: { lines: { from, to } } }` — shape conforme aux tests et à la spec.
- Logs étapes: événements `EXTRACT_COMPLETE`, `EMBED_COMPLETE`, `UPSERT_*`, et récap timings (`extract`, `embed`, `upsert`, `total`) — en phase avec exigences de traçage.

## Résultats

- Observations: Implémentation livrée couvre découpage, métadonnées, embeddings 768d et upsert; tests contractuels ciblent overlap=40, dims=768 et monotonie `to`.
- Écarts détectés: Aucun écart manifeste en statique; tokenisation par espaces (non tokenizer BPE) — acceptable si l’original spécifie un découpage « approx. tokens ». À confirmer lors d’exécution.
- Captures/logs: non applicable (exécution non réalisée).

## Recommandations & décisions

- Actions requises: Exécuter les tests `chunking-*.test.ts` pour valider overlap et métadonnées; vérifier latences loggées si requis par la parité.
- Acceptation conditionnelle / Refus: Acceptation conditionnelle, sous réserve de passage des tests contractuels.

## Limitations

- Audit statique uniquement (aucune installation autorisée); tests non exécutés.
- La sémantique exacte « token » dépend ici d’un split whitespace; si l’original impose un tokenizer spécifique, un ajustement pourrait être nécessaire.

## Suivi Task‑Master

- Tâches liées: 9
- Commandes:
  - `task-master set-status --id=9 --status=review`
  - `task-master set-status --id=9 --status=done`

## Historique des versions

- v1.4: audit statique (équipe 01) sans exécution
