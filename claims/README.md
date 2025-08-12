## Répertoire claims/

- Objet: demandes de changement (claims) liées aux tâches Task‑Master et à la parité avec l’original.
- Template: utiliser `claims/TEMPLATE_CLAIM.md` (copier puis remplir front‑matter + sections).

### Nommage des fichiers
- `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-claim[_resubmit-<n>]_v<maj.min>.md`
- Exemples:
  - `20250811_tm-2-team-02-ingestion-claim_v1.0.md`
  - `20250812_tm-1+6-team-03-rag-audio-claim_resubmit-1_v1.1.md`
- Règles: minuscules, kebab‑case, ASCII; plusieurs IDs via `+`; ne pas inclure le statut dans le nom (mettre dans le front‑matter).

### Front‑matter YAML requis
- `title, doc_kind=claim, team, team_name, tm_ids, scope, status, version, author, related_files`

### Exigences de conformité
- Au moins une ligne `#TEST:` pointant vers des preuves (tests, logs, artefacts)
- Références attendues vers `docs/spec/...`, `docs/clone/...`, `docs/ANNEXES_PAYLOADS.md`

### Workflow rapide
1. Dupliquer le template; remplir front‑matter et sections (Résumé, Contexte, Portée, CA, Impacts, Risques, Références, Limitations, Suivi).
2. Lier les IDs `.taskmaster` dans `tm_ids` et dans la section Suivi.
3. Soumettre à l’audit correspondant (fichier dans `audit/`, lié via `related_files`).

### Rappels gouvernance
- Flux: SPEC → IMPL → TEST → AUDIT
- Commandes utiles:
  - `task-master set-status --id=<ID> --status=in-progress`
  - `task-master set-status --id=<ID> --status=review`

#TEST: docs/spec/README.md

## Limitations
- Ce README encadre le format documentaire; il n’introduit aucune exigence hors parité. 