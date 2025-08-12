---
title: "Audit Logging & Erreurs — Conformité OpenAPI"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [10]
scope: logging|errors
status: draft
version: 1.0
author: ia
related_files: ["../docs/spec/openapi.yaml"]
---

# Audit — Logging & Erreurs (ErrorResponse, correlation_id)

#TEST: orchestrator/test/contract/*.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Uniformiser les réponses d’erreurs et la corrélation des logs selon `docs/spec/openapi.yaml`.
- Décision: À implémenter (middleware erreurs + correlation_id + redaction + métriques latences).
- Points bloquants: absence de middleware ErrorResponse uniforme; pas de `correlation_id`.

## Références

- Spécifications: `docs/spec/openapi.yaml` (ErrorResponse), `docs/TECHNICAL_GUIDELINES.md` (robustesse)

## Méthodologie

- Jeux d’essai: contract tests (401), futurs tests d’erreurs 400/422/500.
- Procédure: inspection des handlers; plan d’implémentation middleware.

## Vérifications de parité

- HTTP: 400/401/422/500; schéma ErrorResponse utilisé.
- Logs: `correlation_id` propagé sur chaque log requête/erreur; redaction secrets.

## Résultats

- Observations: logs JSON présents; manque uniformisation erreurs/corrélation.
- Écarts: ErrorResponse absent; pas de corrélation systématique.

## Recommandations & décisions

- Actions requises: ajouter middleware erreurs; générer ULID `correlation_id`; standardiser réponses; instrumenter métriques.
- Acceptation: après tests d’erreur verts et présence `correlation_id`.

## Limitations

- Tests d’erreurs détaillés manquants; à créer.

## Suivi Task‑Master

- Tâches liées: 10.2 (SPEC), 10.3 (IMPL), 10.4 (TEST), 10.5 (AUDIT)
- Commandes:
  - `task-master set-status --id=10.2 --status=in-progress`

## Historique des versions

- v1.0: création du brouillon