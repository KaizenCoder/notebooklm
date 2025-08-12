## Répertoire audit/

- Objet: vérifications d’une revendication ou d’un périmètre (parité HTTP, DB, Storage, Logs/erreurs), sans introduire d’exigences nouvelles.
- Template: utiliser `audit/TEMPLATE_AUDIT.md` (copier puis remplir front‑matter + sections).

### Nommage des fichiers
- `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-audit_v<maj.min>.md`
- Exemple:
  - `20250811_tm-1+6-team-03-rag-audio-audit_v1.0.md`
- Règles: minuscules, kebab‑case, ASCII; plusieurs IDs via `+`; ne pas inclure le statut dans le nom (mettre dans le front‑matter).

### Front‑matter YAML requis
- `title, doc_kind=audit, team, team_name, tm_ids, scope, status, version, author, related_files`

### Exigences de conformité
- Au moins une ligne `#TEST:` pointant vers des preuves (tests contract/integration, logs, artefacts)
- Références attendues vers `docs/spec/...`, `docs/clone/...`, `docs/ANNEXES_PAYLOADS.md`

### Checklist d’audit (résumé)
- HTTP: statuts, headers (`Authorization`), payloads conformes
- DB: `n8n_chat_histories`, `documents` (embedding 768d, metadata `notebook_id`, `source_id`, `loc.lines`), RPC `match_documents`
- Storage: fichiers/buckets attendus, URLs/callbacks
- Logs/erreurs: format `{ code, message, details?, correlation_id }`

### Workflow rapide
1. Dupliquer le template; lier le claim dans `related_files`.
2. Compléter Références, Méthodologie, Vérifications, Résultats, Recommandations, Limitations, Suivi.
3. Passer la sous‑tâche AUDIT en `review`, puis `done` après validation.

### Rappels gouvernance
- Flux: SPEC → IMPL → TEST → AUDIT
- Commandes utiles:
  - `task-master set-status --id=<ID> --status=review`
  - `task-master set-status --id=<ID> --status=done`

#TEST: docs/spec/README.md

## Limitations
- Ce README encadre le format documentaire; il n’introduit aucune exigence hors parité.

<!-- CI-kick: 2025-08-12T16:40Z -->