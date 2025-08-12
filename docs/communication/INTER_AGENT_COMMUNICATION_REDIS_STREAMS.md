# Communication inter‑agents via Redis Streams (référence)

## Objectif
Fournir un bus de communication homogène pour tous les agents (orchestrateur, implémenteur, auditeur, etc.) basé sur Redis Streams.

## Canaux
- Global: `agents:global`
- Boîte orchestrateur: `agents:orchestrator`
- Canal par duo impl/audit: `agents:pair:<team>` (ex: `agents:pair:team03`)
- Héritage (à décommissionner): `coordination_heartbeat`

## Schéma de message (champs principaux)
- `from_agent` (string)
- `team` (string)
- `role` ("spec"|"impl"|"test"|"audit"|"ops"|"coord"|"orchestrator")
- `to` (string: orchestrator|auditor|impl|<agent_id>)
- `topic` (ex: HEARTBEAT|BLOCKER|AUDIT_REQUEST|AUDIT_VERDICT|STATUS_UPDATE)
- `event` (ex: AGENT_ONLINE|AUDITOR_ALIVE|READY_FOR_AUDIT|APPROVED)
- `status` (ex: ONLINE|IN_PROGRESS|READY|ACK|OK)
- `timestamp` (ISO8601)
- `correlation_id` (string unique)
- `pair_id` (string: <team>)
- Optionnels: `tm_ids` (array json), `task_id`, `severity`, `details`, `links[]`

Tous les champs sont sérialisés en chaînes dans Redis. Les valeurs de type liste doivent être encodées JSON (ex: `tm_ids` = `["T3"]`).

## Heartbeats (obligatoire)
- À l'initialisation: publier `topic=HEARTBEAT, event=AGENT_ONLINE, status=ONLINE` sur `agents:pair:<team>` ET `agents:global`.
- Périodique: toutes les 600 s (± jitter 30 s) publier `event=*_ALIVE, status=ONLINE`.
- Arrêt propre: `event=AGENT_OFFLINE, status=OFFLINE`.

## Exemples redis‑cli
```bash
# Boot
redis-cli XADD agents:pair:team03 "*" from_agent "auditor_team03" team "team03" role "audit" to "orchestrator" topic "HEARTBEAT" event "AGENT_ONLINE" status "ONLINE" timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" tm_ids "[\"team03\"]" details "boot heartbeat"

# Ping périodique
redis-cli XADD agents:pair:team03 "*" from_agent "auditor_team03" team "team03" role "audit" to "orchestrator" topic "HEARTBEAT" event "AUDITOR_ALIVE" status "ONLINE" timestamp "$(date -Is)" correlation_id "$(uuidgen)" pair_id "team03" tm_ids "[\"team03\"]" details "periodic heartbeat"

# Lecture avec groupe (consommation fiable)
redis-cli XGROUP CREATE agents:pair:team03 supervision "$" MKSTREAM 2>/dev/null
redis-cli XREADGROUP GROUP supervision sup-1 COUNT 10 BLOCK 0 STREAMS agents:pair:team03 >
```

## Script unifié côté agent
Fichier: `orchestrator/scripts/agent-heartbeat.mjs`
- Modes: `--mode boot|loop|shutdown`
- Options clés: `--redis`, `--streams`, `--agent`, `--team`, `--role`, `--to`, `--pair`, `--interval_ms`, `--jitter_ms`, `--tm_ids`
- Exemple:
```bash
node scripts/agent-heartbeat.mjs --mode loop --redis redis://127.0.0.1:6379 --streams agents:pair:team03,agents:global --agent auditor_team03 --team team03 --role audit --to orchestrator --pair team03 --interval_ms 600000 --jitter_ms 30000
```

## Obligations d'utilisation
- Tous les agents DOIVENT utiliser Redis Streams pour toute communication inter‑agent (heartbeats, claims, audits, status updates).
- Toute publication de Claim (fichiers dans `claims/`) doit être précédée d'un `STATUS_UPDATE` sur `agents:pair:<team>` avec lien vers la PR ou preuve associée.
- Toute publication d'Audit (fichiers dans `audit/`) doit être précédée d'un `AUDIT_REQUEST` ou `AUDIT_VERDICT` selon le rôle.
- Chaque document `.md` de claim/audit DOIT référencer une preuve via `#TEST:` et inclure `## Limitations` (conformité rules).

## Bonnes pratiques
- Utiliser `XREADGROUP` + `XACK` côté consommateur.
- Inclure `correlation_id` et `pair_id` systématiquement.
- Jitter pour heartbeats pour éviter les pics synchrones.
- Optionnel: maintenir `SETEX agent:lastseen:<id>` pour des checks rapides.

## Dépréciations
- `coordination_heartbeat` est en cours de retrait. Utiliser exclusivement `agents:*`.
