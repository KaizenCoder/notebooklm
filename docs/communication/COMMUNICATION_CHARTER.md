# Charte de Communication Inter‑Équipes (Redis Streams)

> Standard opérationnel pour SPEC → IMPL → TEST → AUDIT, basé sur Redis Streams.
>
> #TEST: copernic/03.implementation/tests/integration/test_cross_environment_communication.py
> #TEST: copernic/03.implementation/tests/coordination/test_redis_streams_multi_environment.py

---

## 1. Objectifs et Mesures
- Réduire les délais d’attente entre étapes via un bus évènementiel commun.
- Cibles mesurées: ACK ≤ 15 min ouvrées sur `requests_for_*`; SPEC→IMPL ≤ 4 h; REVUE IMPL ≤ 24 h; VERDICT AUDIT ≤ 24 h.

## 2. Canaux Initiaux
- `coordination_heartbeat`: états début/fin/intermédiaires par tâche (INFO).
- `coordination_blockers`: blocages transverses avec `severity` (WARN/CRITICAL) et `owner`.
- `audit_requests`: soumissions d’audit (READY), lien claims/tests.
- `auditeur_compliance`: verdict audit (APPROVED/REJECTED) + motifs.

## 3. Nomenclature & Rétention
- Préfixe d’écriture par équipe, ex: `orange:*`, `violet:*` (si clés Redis dédiées).
- MAXLEN conservateur (ex: 10k) sur chaque stream, ajusté selon volume.

## 4. Schéma Message (extrait)
Champs requis: `from_agent`, `team`, `role`, `tm_ids`, `task_id`, `subtask_id`, `event`, `status`, `severity`, `timestamp`, `correlation_id`.
Champs optionnels: `details`, `links` (PR/commit/docs), `test_refs` (`#TEST:`), `doc_refs`, `env`.
Règles: taille ≤ 2 KB; aucun secret; message actionnable (verbe + destinataire explicite).

## 5. SLAs & Rituels
- ACK demandes ≤ 15 min ouvrées; daily 10’ sur `coordination_blockers` (Top 10 récents).
- Hebdo parité: checklist + résumé publié (écarts/decisions).

## 6. Sécurité & Conformité
- Secrets interdits en payload; logs/streams: anonymiser/redacter `Authorization`.
- `correlation_id` obligatoire; lien vers `docs/DECISIONS.md` pour décisions.

## 7. Acceptation & KPIs
- Démo: publication/lecture sur 4 canaux + horodatage, messages valides schéma.
- KPIs: temps d’ACK, SPEC→IMPL, IMPL→AUDIT, nb blocages/sevérité.

## 8. Gouvernance
- Évolution canaux sous PR + validation hebdo parité.

## 9. Découverte & Méthodologie
- Méthodologie Impl/Audit (existante, à suivre): `documentation/COMMUNICATION_METHODOLOGIE_IMPL_AUDIT.md`
- Guide d’utilisation Redis (opérations): `documentation/REDIS_USAGE_GUIDE.md`
- Quickstarts FR/EN: `documentation/INTER_AGENT_COMMUNICATION_REDIS_STREAMS_QUICKSTART*.md`

## Limitations
- Redis mono‑instance en dev: non HA; prévoir sentinel/cluster en prod.
- Risque bruit: appliquer MAXLEN, sévérité et canaux dédiés par besoin.
