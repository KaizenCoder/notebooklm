# Journal des Décisions (liées à Task‑Master)

Objet
- Cadrer les revues de parité et la gouvernance. Toute décision est traçable via un ID Task‑Master et des références aux dépôts originaux.

Modèle d’entrée (copier/coller)
- ID(s) Task‑Master: TM‑__/__.__
- Date/Heure: __/__/____ __:__
- Sujet: (ex.: Aligner `top_k=5` pour RAG)
- Type: [Parité | Technique | Produit | Sécurité | Perf]
- Contexte:
  - Réfs internes: `docs/PRD.md#...`, `docs/ORCHESTRATOR_IMPLEMENTATION_PLAN.md#...`
  - Réfs originales: `docs/clone/...`
- Décision:
  - Énoncé clair et testable.
- Justification:
  - Preuves de parité (payloads/headers/status, side‑effects DB, UI), mesures/perfs, contraintes.
- Impact:
  - Code, tests, documentation, perf/sécurité, données.
- Actions de suivi:
  - Tâches Task‑Master à créer/mettre à jour.

Index (résumé des entrées)
- [x] TM-19/2.7/3.6/4.6 — Demande de généralisation: Idempotency-Key, modèle d’erreur, correlation_id, chunking tokens + embeddings 768

Historique détaillé
- [x] ID(s) Task‑Master: TM-19/2.7/3.6/4.6
  - Date/Heure: 2025-08-11 22:25
  - Sujet: Demande de généralisation des patterns transverses (idempotence, erreurs, traçabilité, chunking/embeddings)
  - Type: Technique
  - Contexte:
    - Réfs internes: `docs/TECHNICAL_GUIDELINES.md#1-5`, `docs/spec/openapi.yaml`, `audit/audit_process-document_v1.md`, `audit/audit_additional-sources_v1.md`, `audit/audit_additional-sources_pdf_asr_v1.md`
    - Réfs originales: `docs/clone/...`
  - Décision:
    - Imposer globalement:
      1) Support en‑tête `Idempotency-Key` pour les opérations d’ingestion (process-document, additional-sources, generate-audio).
      2) Réponses d’erreur contractuelles (schema ErrorResponse OpenAPI) et codes 4xx/5xx selon validation/erreur interne.
      3) `correlation_id` par requête dans les logs structurés.
      4) Chunking en tokens (~200) avec overlap + embeddings dimension 768 en batch, métadonnées `loc.lines` conservées.
  - Justification:
    - Recommandations répétées dans les audits équipe 2; cohérence technique; exigences de robustesse/traçabilité (TECHNICAL_GUIDELINES); parité attendue.
  - Impact:
    - Code orchestrator (middlewares idempotence/logs; handlers validation/erreurs); tests (contrats/idempotence); doc specs (OpenAPI) et checklists.
  - Actions de suivi:
    - Tâches Task‑Master: 15 (idempotence), 9 (chunking/embeddings), 10 (logging/errors), MAJ specs (2/3/4), et clôture 19.
