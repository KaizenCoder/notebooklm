# Politique Redis Streams — Claims & Audits (MANDATORY)

Cette politique rend OBLIGATOIRE l’usage de Redis Streams `agents:*` pour toute activité liée aux claims (demandes) et aux audits.

## Canaux à utiliser
- Global: `agents:global`
- Pair (duo impl/audit): `agents:pair:<team>` (ex: `agents:pair:team03`)
- Inbox orchestrateur (si besoin): `agents:orchestrator`

## Obligations
- Avant toute création ou mise à jour d’un document dans `claims/`:
  - Publier un `STATUS_UPDATE` sur `agents:pair:<team>` contenant au moins: `from_agent, team, role, to, topic=STATUS_UPDATE, event, status, timestamp, correlation_id, pair_id, links[] (PR, artefacts)`
- Avant toute création ou mise à jour d’un document dans `audit/`:
  - Impl → Audit: publier `AUDIT_REQUEST` (ex: `event=READY_FOR_AUDIT, status=READY`) sur `agents:pair:<team>`
  - Audit → Impl: publier `AUDIT_VERDICT` (ex: `event=APPROVED|REJECTED`) sur `agents:pair:<team>` avec `details` et liens de preuves
- Heartbeats: chaque agent publie `AGENT_ONLINE` au boot, puis `*_ALIVE` toutes les 600 s (± 30 s), sur pair + global.
- Consommation: utiliser `XREADGROUP` + `XACK`; groupes recommandés: `impl_<team>`, `audit_<team>`, `supervision`.

## Exemples (redis-cli)
```bash
# Claim: publication STATUS_UPDATE préalable
redis-cli XADD agents:pair:team03 "*" \
  from_agent "impl_team03" team "team03" role "impl" to "auditor_team03" \
  topic "STATUS_UPDATE" event "CLAIM_PUBLISHED" status "INFO" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"https://github.com/org/repo/pull/123\"]" details "Claim TM-03 publié"

# Audit: demande d’audit (impl → audit)
redis-cli XADD agents:pair:team03 "*" \
  from_agent "impl_team03" team "team03" role "impl" to "auditor_team03" \
  topic "AUDIT_REQUEST" event "READY_FOR_AUDIT" status "READY" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"/claims/20250812_tm-...md\"]" details "Bundle prêt pour audit"

# Audit: verdict (audit → impl)
redis-cli XADD agents:pair:team03 "*" \
  from_agent "auditor_team03" team "team03" role "audit" to "impl_team03" \
  topic "AUDIT_VERDICT" event "APPROVED" status "OK" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" \
  links "[\"/audit/20250812_tm-...md\"]" details "Conforme, go merge"
```

## Rappels conformité documentation
- Chaque document `.md` de claim/audit doit contenir au moins une ligne `#TEST:` (preuve), et la section `## Limitations`.
- Les messages sur le bus doivent inclure `correlation_id` et `pair_id`.
- `coordination_heartbeat` est déprécié: utiliser `agents:*`.

Voir aussi: `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md` et `docs/CHECKLIST_TESTS_V1.md` (section 0).
