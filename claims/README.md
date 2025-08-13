# Claims — Exigences de communication (MANDATORY)

Avant toute création/mise à jour d’un fichier dans `claims/`, publier un message Redis Streams:

- Stream: `agents:pair:<team>` (ex: `agents:pair:team03`)
- Payload minimal: `from_agent, team, role, to, topic=STATUS_UPDATE, event=CLAIM_PUBLISHED, status=INFO, timestamp, correlation_id, pair_id, links[]`

Exemple:
```bash
redis-cli XADD agents:pair:team03 "*" \
  from_agent "impl_team03" team "team03" role "impl" to "auditor_team03" \
  topic "STATUS_UPDATE" event "CLAIM_PUBLISHED" status "INFO" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"https://github.com/org/repo/pull/123\"]" details "Claim TM-03 publié"
```

Rappels:
- Inclure `#TEST:` et `## Limitations` dans le markdown.
- `correlation_id` et `pair_id` obligatoires dans le message.
- `coordination_heartbeat` déprécié: utiliser `agents:*`.

Référence continue (obligatoire):
- Citer les fichiers d’origine sous `docs/clone/...` (chemins + lignes si utile) dans le corps du claim
- Ajouter un bloc "Source originale" dans la PR correspondante
- Lier toute adaptation à `docs/DECISIONS.md` (rationale + impact)

Gate auditeur:
- Le passage en done de la tâche associée est conditionné par la validation explicite de l’auditeur (verdict dans la PR). 

Voir: `docs/communication/CLAIMS_AUDITS_REDIS_POLICY.md`.
