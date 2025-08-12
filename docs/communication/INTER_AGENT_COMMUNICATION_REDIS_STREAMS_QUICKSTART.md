# 📡 Inter‑Agent Communication via Redis Streams — Quickstart

> Guide portable pour intégrer la communication inter‑agents (développement et audit) dans un autre projet, basé sur Redis Streams.
>
> #TEST: copernic/03.implementation/tests/coordination/test_redis_streams_multi_environment.py
> #TEST: copernic/03.implementation/tests/integration/test_cross_environment_communication.py
> #TEST: copernic/03.implementation/tests/handover/test_handover_template_compliance.py
> #TEST: copernic/03.implementation/tests/serviceregistry/test_serviceregistry_coordination.py

---

## 🎯 Objectif
Mettre en place une messagerie inter‑agents simple et robuste, avec canaux standardisés (heartbeat, demandes inter‑équipes, audit) et convention de messages compatible « handover ».

---

## 🧩 Prérequis
- Redis ≥ 6 (Streams activés par défaut)
- Accès CLI `redis-cli` ou client Python `redis` (optionnel)
- Docker (optionnel)

### Démarrage rapide Redis
```bash
# Option Docker (recommandé)
docker run -d --name nextgen_redis -p 6379:6379 redis:7-alpine

# Vérification
a=127.0.0.1; redis-cli -h $a -p 6379 ping
```

---

## 🗂️ Canaux standard
- Coordination globale (toutes équipes émettent/écoutent)
  - `coordination_heartbeat`: état/activité en cours
  - `emergency_escalation`: escalade critique
- Demandes inter‑équipes (émission ciblée, écoute par l’équipe destinataire)
  - `requests_for_orange`, `requests_for_violet`, `requests_for_magenta`
- Audit (cycle de validation)
  - `audit_requests`: soumission d’audit
  - `auditeur_compliance`: verdict de l’Auditeur

Convention message (champs recommandés):
- `from_agent`, `type`, `task_id`, `details`, `timestamp` (ISO‑8601), `session_id` (si suivi de session), `environment` (si multi‑env)

---

## 🚀 Publication rapide (CLI)
- Heartbeat (début de tâche):
```bash
redis-cli XADD coordination_heartbeat "*" \
  from_agent "magenta_specialist" \
  event "TASK_START" \
  task_id "18" \
  details "Starting work on Task 18"
```

- Demande à l’équipe Orange (tests d’intégration):
```bash
redis-cli XADD requests_for_orange "*" \
  from_agent "magenta_specialist" \
  request_type "INTEGRATION_TEST" \
  task_id "18" \
  details "TaskPlanner base ready for integration testing"
```

- Soumission d’audit:
```bash
redis-cli XADD audit_requests "*" \
  from_agent "magenta_specialist" \
  task_id "18" \
  details "Task 18 complete and ready for audit"
```

- Verdict Auditeur:
```bash
redis-cli XADD auditeur_compliance "*" \
  from_agent "claude_auditeur" \
  task_id "18" \
  status "APPROVED" \
  details "Compliant with architecture & security standards"
```

- Lecture rapide:
```bash
redis-cli XREVRANGE coordination_heartbeat + - COUNT 10
redis-cli XREVRANGE audit_requests + - COUNT 10
redis-cli XREVRANGE auditeur_compliance + - COUNT 10
```

---

## 🐍 Publication via Python (optionnel)
```python
import redis, json
from datetime import datetime

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

r.xadd("audit_requests", {
  "from_agent": "magenta_specialist",
  "task_id": "18",
  "details": "Ready for audit",
  "timestamp": datetime.utcnow().isoformat()
})
```

---

## 🔁 Workflow d’audit (exemple minimal)
1) L’équipe de dev publie sur `audit_requests` avec `task_id`, `details` et `timestamp`.
2) L’Auditeur consomme, vérifie et publie le verdict sur `auditeur_compliance` (`status`: APPROVED/REJECTED, `details`).
3) Les équipes écoutent `auditeur_compliance` pour clôturer/relancer.

Exemples détaillés de scripts (adaptables):
- `audit/SCRIPT AUDIT/TACHE 17/task17_4_audit_request.py`
- `audit/SCRIPT AUDIT/TACHE 17/task17_5_audit_request.py`
- `audit/SCRIPT AUDIT/TACHE 17/task17_6_audit_request.py`
- `audit/SCRIPT AUDIT/TACHE 17/task17_8_final_audit_request.py`

---

## 📈 Observabilité (optionnelle)
- Heartbeat périodique sur `coordination_heartbeat` (début/fin de tâche, état)
- Alerte critique via `emergency_escalation` (`severity`: CRITICAL)
- Métriques Prometheus (si FastAPI/ServiceRegistry): exposer un endpoint dédié (cf. design Prometheus dans `core/monitoring/service_registry_metrics.py`).

---

## 🔒 Sécurité (recommandations)
- Séparer les droits d’écriture par équipe (préfixes dédiés)
- Signer les messages critiques (hash + horodatage) si nécessaire
- Ne jamais publier de secrets en clair dans les Streams

---

## 🧪 Intégration CI & tests
- Tests d’intégration publics (références) — à adapter à votre projet:
  - `tests/coordination/test_redis_streams_multi_environment.py`
  - `tests/integration/test_cross_environment_communication.py`
  - `tests/handover/test_handover_template_compliance.py`
  - `tests/serviceregistry/test_serviceregistry_coordination.py`

Conseils:
- Mock Redis pour tests unitaires
- Tests d’intégration avec Redis réel en CI (job docker Redis)

---

## ⚠️ Limitations
- Single point of failure si une seule instance Redis
- Pas de garantie de cohérence forte inter‑services (Streams = at‑least‑once si mal configuré)
- Rétention à configurer (MAXLEN) selon volume attendu
- Chiffrement/authentification à gérer en dehors de Redis par défaut

---

## 📦 Portage dans un autre projet
- Copier ce guide et créer une cible `redis` (Docker compose ou service managé)
- Définir vos canaux (au minimum: `coordination_heartbeat`, `audit_requests`, `auditeur_compliance`)
- Normaliser les champs requis (ex: `from_agent`, `task_id`, `details`, `timestamp`)
- Intégrer des tests d’intégration et référencer leurs chemins via `#TEST:` dans vos docs

---

## 📚 Références utiles (dans le projet source)
- `copernic/REDIS_STREAMS_OPERATIONAL_GUIDE.md`
- `copernic/06.coordination/redis_streams_communication_overview.md`
- `copernic/03.implementation/src/core/service_registry.py`
- `copernic/03.implementation/src/monitoring/service_health_monitor.py`
- `copernic/03.implementation/src/interfaces/service_discovery_api.py`
