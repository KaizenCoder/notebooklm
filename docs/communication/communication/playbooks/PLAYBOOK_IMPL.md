# Playbook — Implémentation

> #TEST: copernic/03.implementation/tests/serviceregistry/test_serviceregistry_coordination.py

## Rôles
- Publier heartbeat aux transitions (START/IN_PROGRESS/DONE)
- Signaler blocages (`coordination_blockers`) avec `severity` et `owner`

## Snippets `redis-cli`
```bash
# START
redis-cli XADD coordination_heartbeat "*" from_agent "impl_bot" team "orange" role "impl" tm_ids "[\"7\",\"7.1\"]" task_id "7" subtask_id "7.1" event "TASK_START" status "IN_PROGRESS" severity "INFO" timestamp "$(date -Is)" correlation_id "$(uuidgen)"

# BLOCKER
redis-cli XADD coordination_blockers "*" from_agent "impl_bot" team "orange" role "impl" tm_ids "[\"7\"]" task_id "7" event "BLOCKED" status "WAITING" severity "CRITICAL" owner "orange:lead" details "env var missing" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

## Hooks Task‑Master (exemples)
- À chaque `set-status --id=<id> --status=READY|REVIEW|DONE`, publier un XADD conforme `message.schema.json`.

## Limitations
- Exemple non validé automatiquement: exécuter la validation schéma en CI.
