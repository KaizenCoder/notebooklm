---
title: "Audit TM-9 — Chunking + Embeddings (768) — Clone strict"
doc_kind: "audit"
team: "team-01"
team_name: "Foundations"
tm_ids: ["9"]
scope: "orchestrator/services/document.ts"
status: "reviewed"
version: "v1.1"
author: "AI Auditor"
related_files:
  - "orchestrator/src/services/document.ts"
  - "orchestrator/src/services/db.ts"
  - "orchestrator/test/contract/chunking-overlap-dims.test.ts"
  - "orchestrator/test/contract/document-embeddings.test.ts"
---

#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts

## Contexte
- Objectif clone strict: chunking par ~200 tokens avec overlap (~40), embeddings 768d, métadonnées `loc.lines`, upsert documents.
- Cible: `orchestrator/src/services/document.ts` (chunking/embeddings) et `orchestrator/src/services/db.ts` (upsert).

## Méthode
- Lecture ciblée des services `document.ts` et `db.ts`.
- Exécution locale de la suite de tests contrats/E2E (verts au moment de l’audit).
- Analyse différentielle par rapport aux exigences PRD/TECHNICAL_GUIDELINES.

## Constats
- Chunking:
  - Implémenté via découpe par mots (≈ tokens) `targetTokens = 200`, `overlapTokens = 40`.
  - Calcul `loc.lines` par `indexOf(slice)` sur le texte global (approximation sensible aux répétitions).
- Embeddings:
  - Calcul par chunk, concurrence limitée (4).
  - Pas d’enforcement explicite de dimension 768 avant l’upsert.
- Upsert DB:
  - Insertion ligne-à-ligne, sans batch insert ni contrainte d’unicité/clé logique.
- Tests:
  - `chunking-overlap-dims`: vérifie uniquement « au moins 2 chunks ».
  - `document-embeddings`: dimension simulée 8 (mock), pas de vérif 768d ni d’overlap effectif, ni de `loc.lines`.

## Écarts vs exigences
- Embeddings 768d non garantis contractuellement (risque d’insérer des vecteurs de longueur inattendue si l’impl change ou si l’API échoue partiellement).
- Overlap non testé de façon stricte (absence d’assertion sur recouvrement effectif entre chunks consécutifs).
- `loc.lines` calculé par recherche de sous-chaîne → ambiguïtés potentielles avec motifs répétés.
- Pas de batching embeddings/insert SQL → coût/latence supérieurs potentiels vs l’original si celui-ci batch.

## Recommandations
### SPEC
- Définir « embeddings 768d obligatoires » (stratégie en cas de non-conformité: fail/pad/truncate) et documenter.
- Préciser la règle d’overlap (40 tokens) et la méthode de tokenisation (whitespace vs BPE) + implications.
- Spécifier la sémantique d’upsert (append-only vs upsert by fingerprint) et option d’insertion batch.

### IMPL
- Ajouter une validation des dimensions embeddings (=768) avant `upsertDocuments` (échec contrôlé 422/500 ou normalisation stricte).
- Option d’appel embeddings en mini-batch (si support API) ou regroupement paquets côté client.
- Améliorer `loc.lines`: stocker aussi offsets caractères ou interval tokens pour robustesse citations.
- Regrouper l’insert en batch (`INSERT ... VALUES (...),(...);` ou `COPY`) si acceptable.

### TEST
- Créer tests contrats supplémentaires:
  - « dims strictes »: vecteurs != 768 → échec attendu.
  - « overlap effectif »: vérif qu’un sous-ensemble de tokens (≈40) est partagé entre chunks adjacents.
  - « metadata loc.lines »: cohérence sur texte synthétique multi-lignes avec répétitions.
  - « batch embeddings/insert »: si impl, assertions sur nombre d’appels/latences simulées.

## Preuves
- Impl chunking/overlap/mapping:
  - `orchestrator/src/services/document.ts` (fonction `chunkTokens`, `processDocument`).
- Impl upsert documents:
  - `orchestrator/src/services/db.ts` (boucle d’inserts, pas de batch ni ON CONFLICT).
- Tests actuels:
  - `orchestrator/test/contract/chunking-overlap-dims.test.ts` (seuil minimal de chunks).
  - `orchestrator/test/contract/document-embeddings.test.ts` (dimension simulée 8, non 768).

## Décision / État
- Conformité partielle acceptable transitoirement (pipeline opérationnel), mais non conforme « clone strict ».
- Priorité: enforcement 768d + tests d’overlap/metadata.

## Plan de suivi (hors Task‑Master)
- Ajouter tests ciblés (sans modifier `.taskmaster`) puis impl courte: validation 768, test d’overlap, amélioration `loc.lines` minimale.

## Limitations
- Tokenisation par whitespace ≠ BPE: le seuil « 200 tokens » est approximatif.
- Absence d’information sur batching embeddings côté API (selon modèle Ollama utilisé).
- Cet audit s’appuie sur l’état courant du code et des tests mocks; il ne mesure pas des latences réelles.
