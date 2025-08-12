# 🧰 Guide d’utilisation de Redis (Streams) pour la communication inter‑agents

> #TEST: copernic/03.implementation/tests/coordination/test_redis_streams_multi_environment.py
> #TEST: copernic/03.implementation/tests/integration/test_cross_environment_communication.py
> #TEST: copernic/03.implementation/tests/handover/test_handover_template_compliance.py
> #TEST: copernic/03.implementation/tests/serviceregistry/test_serviceregistry_coordination.py

---

## 🎯 Objet
Ce document explique comment installer, lancer, utiliser et opérer Redis (avec Streams) pour supporter la communication inter‑équipes/agents (heartbeat, blocages, demandes d’audit, verdicts). Il complète:
- `documentation/communication/COMMUNICATION_CHARTER.md`
- `documentation/communication/message.schema.json`
- Quickstarts FR/EN et bundle Docker minimal.

---

## 🧭 Méthodologie & docs associées
- Méthodologie Impl/Audit (détaillée): `documentation/COMMUNICATION_METHODOLOGIE_IMPL_AUDIT.md`

---

## 🧩 Prérequis
- Redis ≥ 6 (Streams activés par défaut)
- Accès CLI: `redis-cli`
- Docker (optionnel) pour un service local rapide

---

## ⚡ Démarrage rapide

### Option A — Docker Compose (bundle fourni)
```bash
cd copernic/15.assets/redis_minimal
docker compose up -d
redis-cli -h 127.0.0.1 -p 6379 ping  # PONG attendu
```

### Option B — Docker direct
```bash
docker run -d --name nextgen_redis \
  -p 6379:6379 redis:7-alpine \
  redis-server --appendonly yes
redis-cli ping
```

### Option C — Binaire local
Suivre la doc officielle `redis.io/docs`. Démarrer `redis-server`, puis tester `redis-cli ping`.

---

## 🧠 Rappels Redis Streams (essentiel)
- Un stream est une suite append‑only d’entrées ordonnées (ID auto `*` possible)
- Publication: `XADD <stream> * field value [field value ...]`
- Lecture récente (reverse): `XREVRANGE <stream> + - COUNT N`
- Lecture incrémentale: `XREAD COUNT N BLOCK 0 STREAMS <stream> $`
- Groupes de consommateurs (si besoin concurrents): `XGROUP`, `XREADGROUP`

---

## 🔧 Commandes de base (copier/coller)

### Publier un heartbeat (Unix)
```bash
redis-cli XADD coordination_heartbeat "*" \
  from_agent "impl_bot" team "orange" role "impl" \
  tm_ids "[\"7\",\"7.1\"]" task_id "7" subtask_id "7.1" \
  event "TASK_START" status "IN_PROGRESS" severity "INFO" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

### Publier un heartbeat (Windows PowerShell)
```powershell
$ts=(Get-Date).ToString("o"); $cid=[guid]::NewGuid().ToString()
redis-cli XADD coordination_heartbeat "*" from_agent impl_bot team orange role impl tm_ids "[\"7\",\"7.1\"]" task_id 7 subtask_id 7.1 event TASK_START status IN_PROGRESS severity INFO timestamp $ts correlation_id $cid
```

### Lire les 10 derniers messages
```bash
redis-cli XREVRANGE coordination_heartbeat + - COUNT 10
```

### Signaler un blocage
```bash
redis-cli XADD coordination_blockers "*" \
  from_agent "impl_bot" team "orange" role "impl" tm_ids "[\"7\"]" task_id "7" \
  event "BLOCKED" status "WAITING" severity "CRITICAL" owner "orange:lead" \
  details "env var missing" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

### Soumettre une demande d’audit
```bash
redis-cli XADD audit_requests "*" \
  from_agent "spec_bot" team "magenta" role "spec" tm_ids "[\"7\"]" task_id "7" \
  event "AUDIT_REQUEST" status "READY" severity "INFO" \
  links "[\"https://example.com/pr/123\"]" \
  timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

### Publier le verdict audit
```bash
redis-cli XADD auditeur_compliance "*" \
  from_agent "auditor" team "violet" role "audit" tm_ids "[\"7\"]" task_id "7" \
  event "AUDIT_VERDICT" status "APPROVED" severity "INFO" \
  details "OK" timestamp "$(date -Is)" correlation_id "$(uuidgen)"
```

---

## 📐 Conventions & Schéma
- Les messages doivent respecter `documentation/communication/message.schema.json`
- Champs requis: `from_agent`, `team`, `role`, `tm_ids`, `task_id`, `event`, `status`, `timestamp`, `correlation_id`
- Lorsque `status=READY`, fournir `links` vers artefacts (PR, rapport, etc.)
- Taille ≤ 2 KB, aucun secret en clair

Validation locale (ajv):
```bash
npm i -g ajv-cli
ajv validate -s copernic/documentation/communication/message.schema.json -d sample.json
```

---

## 🧱 Rétention & maintenance
- Appliquer un `MAXLEN` par stream selon volume (ex: 10k):
```bash
redis-cli XADD coordination_heartbeat MAXLEN ~ 10000 "*" field value
```
- Purges ciblées via `XTRIM` si nécessaire
- Surveiller l’espace mémoire: `INFO memory`

---

## 🔒 Sécurité
- Ne jamais publier de secrets; masquer/redacter dans logs/streams
- Environnements sensibles: envisager ACL Redis (`ACL SETUSER ...`)
- Rotation de mot de passe si service exposé hors dev

---

## 🔍 Observabilité & santé
- Ping: `redis-cli ping` → `PONG`
- Statut: `redis-cli INFO server`, `INFO memory`, `INFO clients`
- Monitoring basique: watcher `XREAD` (à ajouter si besoin)

---

## 🧪 CI d’exemple
Voir `documentation/communication/ci/redis-ci-example.yml`:
- Service Redis éphémère
- Validation schéma sur messages d’exemple

---

## 📚 Playbooks & Snippets
- Playbooks (impl, audit, spec, test): `documentation/communication/playbooks/`
- Snippets Unix/Windows: `documentation/communication/snippets/`
- Guides FR/EN: `documentation/INTER_AGENT_COMMUNICATION_REDIS_STREAMS_QUICKSTART*.md`

---

## 🛠️ Dépannage
- `redis-cli ping` ne répond pas:
  - Vérifier conteneur: `docker ps` / logs: `docker logs nextgen_redis`
  - Port 6379 déjà utilisé → changer mapping
- Messages non lus:
  - Vérifier nom du stream, fautes de frappe
  - Utiliser `XREVRANGE <stream> + - COUNT 5` pour inspection
- Messages volumineux:
  - Déplacer contenu vers un artefact externe et référencer via `links`

---

## Limitations
- Redis mono‑instance (dev) = SPOF; pour prod, prévoir Sentinel/Cluster
- Streams non chiffrés: chiffrer le transport si réseau non‑de confiance
- Schéma JSON n’empêche pas la sémantique erronée: appliquer revues/SLAs
