# Charte de Communication Inter‑Équipes (Redis Streams)

> MANDATORY: Toute communication inter‑agents DOIT passer par Redis Streams `agents:*` (agents:global, agents:orchestrator, agents:pair:<team>).
> Aucune alternative (HTTP direct, fichiers, Slack) n’est acceptée pour le suivi opérationnel (heartbeats, claims, audits, status updates).
>
> #TEST: orchestrator/scripts/scan-bus.mjs
> #TEST: orchestrator/scripts/listen-bus.mjs
> #TEST: orchestrator/scripts/agent-heartbeat.mjs

---

## 0. Architecture bus unifié (multi‑flux)
- Canaux normalisés:
  - Global: `agents:global`
  - Inbox orchestrateur: `agents:orchestrator`
  - Pairs équipe: `agents:pair:<team>` (ex: `agents:pair:team03`)
- Schéma commun (extrait): `from_agent, team, role, to, topic, event, status, timestamp, correlation_id, pair_id` (+ optionnels: `tm_ids[], task_id, details, links[]`).
- Consommation fiable: `XREADGROUP` + `XACK` (groupes par rôle: ex. `audit_team03`, `impl_team03`, `supervision`).
- Dépréciation: `coordination_heartbeat` → utiliser exclusivement `agents:*`.

## 1. Objectifs et Mesures
- Bus évènementiel commun pour SPEC → IMPL → TEST → AUDIT.
- Cibles: ACK ≤ 15 min ouvrées sur demandes; SPEC→IMPL ≤ 4 h; VERDICT AUDIT ≤ 24 h.

## 2. Canaux (mise à jour)
- `agents:global`: annonces globales, heartbeats broadcast, statuts transverses.
- `agents:orchestrator`: boîte de réception dédiée orchestrateur.
- `agents:pair:<team>`: échanges duo impl/audit + supervision.
- (Legacy) `coordination_heartbeat`: phase retrait.

## 3. Nomenclature & Rétention
- Préfixe d’équipe via champ `team` et `pair_id` (pas dans le nom de stream).
- MAXLEN conservateur (ex: 10k) par stream, ajustable.

## 4. Schéma Message (extrait)
Champs requis: `from_agent`, `team`, `role`, `to`, `topic`, `event`, `status`, `timestamp`, `correlation_id`, `pair_id`.
Optionnels: `tm_ids[]`, `task_id`, `severity`, `details`, `links[]`, `test_refs[]`, `doc_refs[]`, `env`.
Règles: taille ≤ 2 KB; aucun secret.

## 5. SLAs & Rituels
- ACK demandes ≤ 15 min ouvrées; daily 10’ sur blocages.
- Hebdo parité: checklist + résumé publié.

## 6. Sécurité & Conformité
- Secrets interdits; `correlation_id` obligatoire; logs JSON.
- Référence à `docs/DECISIONS.md` pour décisions/écarts.

## 7. Acceptation & KPIs
- Démo: publication/lecture sur `agents:pair:<team>` + `agents:global`, schéma valide.
- KPIs: temps d’ACK, SPEC→IMPL, IMPL→AUDIT, nb blocages.

## 8. Gouvernance
- Évolutions sous PR; validation hebdo parité.

## 9. Obligations d’utilisation (renforcé)
- Heartbeat obligatoire par agent:
  - Boot: `topic=HEARTBEAT, event=AGENT_ONLINE, status=ONLINE` sur pair + global
  - Périodique: toutes les 600 s (± 30 s) `*_ALIVE`
  - Shutdown: `AGENT_OFFLINE`
- Claims (répertoire `claims/`): publier au préalable `topic=STATUS_UPDATE` sur `agents:pair:<team>` avec liens de preuve/PR.
- Audits (répertoire `audit/`):
  - Impl → Audit: `topic=AUDIT_REQUEST, event=READY_FOR_AUDIT`
  - Audit → Impl: `topic=AUDIT_VERDICT` (APPROVED/REJECTED) + motifs/liens
- Supervision: groupes consommateurs dédiés (`XGROUP CREATE`) et `XACK` systématique.

## Limitations
- Dev mono‑instance Redis: non‑HA (prévoir sentinel/cluster en prod).
- Risque de bruit si mauvais routage (`to`/`pair_id`): appliquer canaux dédiés et MAXLEN.
