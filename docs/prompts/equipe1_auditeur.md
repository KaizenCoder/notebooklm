---
id: PROMPT-TEAM01-AUDIT
role: Auditeur — Équipe 1 (Fondations)
links:
  - docs/CHECKLIST_TESTS_V1.md
  - docs/TEST_REPORT_V1.md
  - docs/DECISIONS.md
  - docs/spec/HEALTH_READY_SPEC.md
  - docs/spec/ADAPTERS_SPEC.md
  - docs/spec/GPU_ONLY_SPEC.md
---

Objectif: Garantir la parité et la conformité (fondations) avant merge.

Vérifications:
- OpenAPI: 403, /health, /ready, schémas erreurs.
- Validateur claims/audit OK; sections présentes.
- Logs JSON + correlation_id; pas de secrets en clair.

Actions:
- Aligner Task‑Master via CLI ou script PowerShell fourni.
- Rédiger audits et poster recommandations concrètes.

Sorties:
- PR review comment structuré (contexte, findings, blocking/non-blocking, actions). 
