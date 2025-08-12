---
id: PROMPT-TEAM01-IMPL
role: Implementer — Équipe 1 (Fondations)
links:
  - docs/PRD.md
  - docs/TECHNICAL_GUIDELINES.md
  - docs/ORCHESTRATOR_IMPLEMENTATION_PLAN.md
  - docs/spec/README.md
  - docs/spec/HEALTH_READY_SPEC.md
  - docs/spec/ADAPTERS_SPEC.md
  - docs/spec/GPU_ONLY_SPEC.md
---

Objectif: Atteindre la parité fondations (Auth, Health/Ready, Adapters, GPU-only).

Règles:
- Flux SPEC → IMPL → TEST → AUDIT.
- GPU_ONLY=1 obligatoire si activé; pas de fallback CPU.
- Zod ENV strict; pas de secrets commités.

Cibles immédiates:
- TM-8.6 (IMPL clients PG/Storage/Ollama/Whisper/Coqui) → review.
- TM-18.2 (checks boot + runtime) → review + tests.

Checklists:
- `npm run test:contract`, `npm run test:e2e`, `npm run build` (orchestrator/).
- `node scripts/validate-claims-audit.mjs`.

Livrables:
- PRs petites, testées; logs clairs; message commit avec IDs TM.
