# Audits — Exigences de communication (MANDATORY)

Avant toute création/mise à jour d’un fichier dans `audit/`:

- Impl → Audit: publier `AUDIT_REQUEST` (READY_FOR_AUDIT) sur `agents:pair:<team>`
- Audit → Impl: publier `AUDIT_VERDICT` (APPROVED/REJECTED) sur `agents:pair:<team>`

Exemples:
```bash
# Demande d’audit
redis-cli XADD agents:pair:team03 "*" \
  from_agent "impl_team03" team "team03" role "impl" to "auditor_team03" \
  topic "AUDIT_REQUEST" event "READY_FOR_AUDIT" status "READY" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"/claims/20250812_tm-...md\"]" details "Bundle prêt pour audit"

# Verdict
redis-cli XADD agents:pair:team03 "*" \
  from_agent "auditor_team03" team "team03" role "audit" to "impl_team03" \
  topic "AUDIT_VERDICT" event "APPROVED" status "OK" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"/audit/20250812_tm-...md\"]" details "Conforme, go merge"
```

Rappels:
- Inclure `#TEST:` et `## Limitations` dans le markdown.
- `correlation_id` et `pair_id` obligatoires dans le message.
- `coordination_heartbeat` déprécié: utiliser `agents:*`.

Référence continue (obligatoire):
- Citer les fichiers d’origine sous `docs/clone/...` (chemins + lignes si utile) dans le corps de l’audit
- Ajouter un bloc "Source originale" dans la PR (ou lien vers claim) 
- Lier toute adaptation à `docs/DECISIONS.md` (rationale + impact)

Travail en binôme & gates:
- L’audit se déroule en couple implémenteur/auditeur; la progression des tâches est bloquée tant que l’auditeur n’a pas rendu de verdict (`AUDIT_VERDICT`).

Voir: `docs/communication/CLAIMS_AUDITS_REDIS_POLICY.md`.
