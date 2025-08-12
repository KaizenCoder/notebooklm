# Playbook — Test

> #TEST: copernic/03.implementation/tests/coordination/test_redis_streams_multi_environment.py

## Rôles
- Vérifier readiness (`status=READY`) et publier résultats de test

## Snippets `redis-cli`
```bash
# Lire 5 derniers heartbeats
redis-cli XREVRANGE coordination_heartbeat + - COUNT 5

# Publier résultat
redis-cli XADD coordination_heartbeat "*" from_agent "qa_bot" team "magenta" role "test" tm_ids "[\"7\"]" task_id "7" event "TEST_RESULTS" status "DONE" severity "INFO" details "12 tests OK" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

## Limitations
- Les détails > 1.5 KB doivent aller dans un artefact externe (lien dans `links`).
