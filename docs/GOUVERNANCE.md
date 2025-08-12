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

