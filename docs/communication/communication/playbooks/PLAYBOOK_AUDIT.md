# Playbook — Audit

> #TEST: copernic/03.implementation/tests/handover/test_handover_template_compliance.py

## Rôles
- Lire `audit_requests` et répondre sur `auditeur_compliance`

## Snippets `redis-cli`
```bash
# LECTURE 10 derniers
redis-cli XREVRANGE audit_requests + - COUNT 10

# VERDICT APPROVED
redis-cli XADD auditeur_compliance "*" from_agent "auditor" team "violet" role "audit" tm_ids "[\"7\"]" task_id "7" event "AUDIT_VERDICT" status "APPROVED" severity "INFO" details "OK" timestamp "$(date -Is)" correlation_id "$(uuidgen)"

# VERDICT REJECTED
redis-cli XADD auditeur_compliance "*" from_agent "auditor" team "violet" role "audit" tm_ids "[\"7\"]" task_id "7" event "AUDIT_VERDICT" status "REJECTED" severity "WARN" details "Tests manquants" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

## Limitations
- Décisions sensibles: référencer un artefact traçable (PR, rapport test) dans `links`.
