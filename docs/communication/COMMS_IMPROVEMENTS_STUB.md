# Stub — Backlog Améliorations Communication Redis Streams

> Objet: consigner les améliorations envisagées sans les implémenter maintenant. Le système actuel est fonctionnel; pas de complexification ni de risque de régression.
>
> #TEST: orchestrator/test/integration/redis-streams-publish.test.ts

## Contexte (état actuel)
- Bus multi‑flux opérationnel: `agents:global`, `agents:orchestrator`, `agents:pair:<team>`
- Heartbeats: boot + périodiques; script `agent-heartbeat.mjs`
- Publisher claims/audits: `claim-audit-publisher.cjs` (flags `--linksJson/--linksFile`, `--maxlen`)
- Observabilité minimale: last‑seen via `agent-heartbeat.mjs` + `agents-ready.mjs`

## Améliorations (déférées)
- CI/tests (priorité haute)
  - AJV sur schéma bus + échantillons
  - Test intégration XREADGROUP robuste (corrélation, groupe éphémère)
- Observabilité
  - Endpoint `/ready_agents` basé sur last‑seen + alerte si délai > 2×interval+jitter
  - Suivi « lag » des consumer groups
- Multi‑équipe
  - Généraliser `listen-bus.mjs`, `send-bus-message.mjs`, scripts de reply avec `--team/--agent/--pair` requis
  - Option: rendre `--team/--agent` obligatoires dans `agent-heartbeat.mjs`
- Rétention/perf
  - Appliquer `MAXLEN` côté orchestrateur/bus pour toutes publications
  - Documenter la politique par défaut (ex: ~10000)
- Sécurité (plus tard)
  - ACL Redis et champ `hmac` optionnel validé côté consommateurs
- Dépréciation
  - Retrait définitif de `coordination_heartbeat` après migration complète

## Ordre recommandé (à planifier)
1) CI schéma + test XREADGROUP — 4–6 h — intérêt 10/10
2) Observabilité last‑seen (endpoint + alerte) — 2–3 h — intérêt 9/10
3) MAXLEN généralisé — 1–2 h — intérêt 8.5/10
4) Scripts multi‑équipes restants — 2 h — intérêt 8/10
5) Lag consumer groups — 2 h — intérêt 7.5/10
6) Strictifier heartbeat (args requis) — 0.5 h — intérêt 7/10
7) Sécurité ACL/HMAC — 3–5 h — intérêt 6.5/10
8) Dépréciation legacy — 1 h — intérêt 6/10

## Décision
- Ne pas implémenter maintenant. Créer des tâches planifiées lorsque nécessaire.

## Limitations
- Ce document liste des pistes d’évolution; il ne constitue pas un engagement ni une spécification détaillée.

