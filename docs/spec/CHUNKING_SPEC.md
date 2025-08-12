# SPEC — Chunking texte & métadonnées

Objectif: définir des règles déterministes de découpage du texte en chunks pour l’indexation (RAG), avec chevauchement, et métadonnées nécessaires aux citations précises.

## Principes
- Déterminisme: même entrée → mêmes chunks et bornes.
- Token-based: taille ~200 tokens par chunk (configurable), overlap fixe.
- Métadonnées: conserver l’origine des lignes pour citations exactes.

## Paramètres par défaut
- `chunk_size_tokens`: 200 (configurable via ENV, ex. `CHUNK_SIZE_TOKENS`)
- `chunk_overlap_tokens`: 40 (configurable via ENV, ex. `CHUNK_OVERLAP_TOKENS`)
- Tokenizer: identique à celui du modèle d’embedding utilisé (Ollama). Interdiction d’un tokenizer divergent.

## Algorithme (esquisse)
1) Normaliser le texte d’entrée (préservation des sauts de ligne).
2) Tokeniser avec le tokenizer aligné embeddings.
3) Parcourir avec fenêtre glissante:
   - Début à 0; fin = min(debut + chunk_size, N)
   - Créer chunk; avancer de `chunk_size - chunk_overlap` jusqu’à fin.
4) Pour chaque chunk, calculer les bornes de lignes dans le texte source:
   - `loc.lines.from` et `loc.lines.to` (1-indexed), selon correspondance token→caractère→ligne.
5) Générer les embeddings par batch (768d attendus) et upsert avec métadonnées.

## Métadonnées obligatoires par chunk
- `notebook_id`: UUID
- `source_id`: UUID
- `loc.lines.from`: int
- `loc.lines.to`: int
- Optionnel: `offset_chars.from`/`to` pour affiner les citations si nécessaire.

## Contraintes & validations
- Dimensions embeddings: 768. Si ≠ 768 → erreur `EMBED_DIM_MISMATCH` (500).
- Idempotence: pas de doublons à l’upsert; un fingerprint par chunk peut être `{source_id, lines.from, lines.to}`.
- Localisation: les bornes de lignes doivent correspondre au texte stocké (PDF/TXT) pour citations fidèles.

## Tests attendus
- #TEST: chunking — tailles ~200 tokens, overlap ~40; couverture complète du texte sans trou.
- #TEST: metadata — `loc.lines.from/to` corrects pour les citations.
- #TEST: idempotence — double indexation ne crée pas de doublons (mêmes clés).

## Limitations
- La correspondance token→ligne dépend du tokenizer et des sauts de ligne du texte normalisé; les tests doivent utiliser la même pipeline.

