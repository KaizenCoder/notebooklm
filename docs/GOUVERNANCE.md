# Gouvernance du Projet — Task‑Master OS

Objectif: garantir parité stricte avec l’original, traçabilité complète et séparation claire des responsabilités via un modèle Implémenteur/Auditeur et un workflow unique piloté par Task‑Master.

Principes
- Pas de tâche, pas de travail: aucune action (SPEC/IMPL/TEST/AUDIT/doc/décision) sans ID `Task‑Master` dans `.taskmaster/tasks.json`.
- Binôme systématique: Implémenteur (code/tests unitaires) et Auditeur (conformité/parité/perfs/sécurité). L’Auditeur valide avant passage en `done`.
- Parité continue: revue hebdomadaire miroir avec l’original (`docs/clone/...`). Écarts documentés, décisions consignées.
- Séparation FE/BE: interfaces contractuelles; FE peut travailler avec mocks contractuels quand BE n’est pas prêt.
- Données locales: PostgreSQL locale (pgvector) obligatoire; Supabase autorisé uniquement en local et pointant sur cette DB.

Workflow standard (par fonctionnalité)
1) SPEC: contrat (ex. OpenAPI, schémas I/O). Bloquant pour IMPL.
2) IMPL: implémentation conforme; commits/PR référencent l’ID de tâche.
3) TEST: tests contrat/intégration; jeux d’oracles communs.
4) AUDIT: revue par l’Auditeur; validation de parité; décisions si écarts.

Rituels
- Revue de parité hebdomadaire: comparer réponses HTTP, side‑effects DB, UX; tracer dans `docs/PARITY_REVIEW_CHECKLIST.md`.
- Decisions log: chaque écart/choix consigné dans `docs/DECISIONS.md` avec ID de tâche, contexte, justification, impact.

Rôles
- Implémenteur: produit la fonctionnalité; tient la SPEC à jour si nécessaire; écrit les tests.
- Auditeur: vérifie parité, conformité, perfs/sécu; arbitre « prêt »; maintient la matrice de parité.

Livrables et traçabilité
- Chaque PR liste les IDs Task‑Master concernés (SPEC/IMPL/TEST/AUDIT).
- Les preuves de parité (payloads/headers/status, diffs SQL/DB, captures UI) sont attachées au rapport `docs/TEST_REPORT_V1.md`.

## Guidance anti‑mock et non‑contournement
- Interdiction d’introduire/maintenir des implémentations « mock/fake/dummy/placeholder/noop » dans `orchestrator/src`.
- Les simulations sont limitées à `orchestrator/test/**`.
- `NO_MOCKS=1` (local/CI) active deux contrôles bloquants:
  - Scan lexical anti‑mock: `ci/anti-mock-scan.ps1`.
  - E2E réel: `ci/no-mocks-check.ps1` (GPU_ONLY=1, DB/Ollama/Whisper/Storage requis).
- Hooks Git pre‑push standardisés:
  - Emplacements versionnés: `scripts/git-hooks/pre-push` (wrapper) et `scripts/git-hooks/pre-push.ps1` (PowerShell fail‑safe).
  - Exécution: le wrapper appelle le `.ps1`; si les scripts `ci/*.ps1` sont absents en local, le hook passe en "skip" explicite; sinon il exécute et bloque en cas d’échec.
  - Installation locale Windows: `.git/hooks/pre-push.ps1` + `.git/hooks/pre-push.cmd` si besoin; `core.hooksPath` est pointé sur `scripts/git-hooks`.
- Toute tentative de « renommer pour contourner » est contraire à la politique et sera bloquée par les contrôles outillés.

#TEST: ci/anti-mock-scan.ps1
#TEST: ci/no-mocks-check.ps1
#TEST: scripts/git-hooks/pre-push.ps1

---

## Politique de Communication Inter‑Agents (OBLIGATOIRE)

- Tous les échanges inter‑agents (orchestrateur, implémenteur, auditeur, etc.) DOIVENT utiliser Redis Streams multi‑flux:
  - Canaux: `agents:global`, `agents:orchestrator`, `agents:pair:<team>` (ex: `agents:pair:team03`).
  - `coordination_heartbeat` est déprécié et ne doit plus être utilisé.
- Heartbeats obligatoires par agent:
  - Boot: `topic=HEARTBEAT, event=AGENT_ONLINE, status=ONLINE` sur pair + global
  - Périodique: toutes les 600 s (± 30 s) `*_ALIVE`
  - Shutdown: `AGENT_OFFLINE`
- Claims & Audits (gating):
  - Claim: publication préalable d’un `STATUS_UPDATE` sur `agents:pair:<team>` avec lien(s) de preuve/PR avant toute création/modif dans `claims/`.
  - Audit: `AUDIT_REQUEST` (impl → audit) puis `AUDIT_VERDICT` (audit → impl) sur `agents:pair:<team>` avant toute création/modif dans `audit/`.
- Conformité et preuves:
  - Les documents `.md` de claims/audits doivent contenir au moins une ligne `#TEST:` et une section `## Limitations`.
  - Les PR doivent référencer les IDs des messages Redis (ou logs équivalents) liés aux publications.
- Référence: voir `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md` et `docs/communication/CLAIMS_AUDITS_REDIS_POLICY.md`.

## Contrôles & CI (exigences)
- Validation schéma des messages (AJV) en CI sur échantillons fournis.
- Checklist de parité mise à jour pour vérifier l’usage du bus (`docs/CHECKLIST_TESTS_V1.md`, section 0).
- Revue hebdo: point systématique sur les heartbeats et publications (claims, audits) observés sur `agents:*`.
