# Playbook — Spécification

> #TEST: copernic/03.implementation/tests/integration/test_cross_environment_communication.py

## Rôles
- Publier demandes de clarification sur `requests_for_*` (si activé)
- Mettre `links` vers documents/specs

## Snippet demande
```bash
redis-cli XADD requests_for_orange "*" from_agent "spec_bot" team "magenta" role "spec" tm_ids "[\"8\"]" task_id "8" event "CLARIFICATION_REQUEST" status "READY" severity "INFO" details "Besoin de champs erreurs" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

## Limitations
- Canaux `requests_for_*` optionnels (activer selon besoin).
