# Demande de mise à jour Task‑Master — Équipe 1 (Auditeur)

Date: 2025-08-11
Rôle: IA-Audit-01 (Fondations)

## Contexte
- Objectif: faire valider et refléter dans Task‑Master l’avancement SPEC/AUDIT des fondations.
- Note: certaines mises à jour locales ont été effectuées dans `.taskmaster/tasks/tasks.json`, mais cette demande sert de source claire pour le coordinateur afin d’actualiser officiellement les statuts via Task‑Master.

## Travaux réalisés
- Lecture et synthèse: `ONBOARDING_AI.md`, `DEVELOPMENT_PLAN.md`.
- SPEC 7.2 (Auth + erreurs): ajout 403 sur tous les endpoints sécurisés; clarification 401 vs 403.
- SPEC 14.1 (ENVs + santé): spécification des ENVs requises et des contrats `/health` (200) et `/ready` (200/503).
- SPEC 8.5 (Adaptateurs): définition des interfaces DB/Storage/Ollama/Whisper/Coqui et des erreurs normalisées.
- SPEC 18.1 (GPU-only): signaux device via Ollama, règles d’enforcement boot/runtime, erreurs.
- AUDIT 14.4 (Santé/Ready): checklist de conformité aux guidelines techniques.
- AUDIT 7.5 (Sécurité/Headers): checklist 401/403 et endpoints publics.

## Fichiers créés/modifiés
- Modifiés (ajout 403):
  - `docs/spec/chat.yaml`
  - `docs/spec/process-document.yaml`
  - `docs/spec/process-additional-sources.yaml`
  - `docs/spec/generate-notebook-content.yaml`
  - `docs/spec/generate-audio.yaml`
- Nouveaux SPEC complémentaires:
  - `docs/spec/HEALTH_READY_SPEC.md`
  - `docs/spec/ADAPTERS_SPEC.md`
  - `docs/spec/GPU_ONLY_SPEC.md`
- Conventions mises à jour:
  - `docs/spec/README.md` (ajout 403 + liens vers SPEC complémentaires)
- Audits rédigés:
  - `audit/20250811_tm-14.4-team-01-foundations-health-audit_v1.0.md`
  - `audit/20250811_tm-7.5-team-01-foundations-logging-audit_v1.0.md`

## Requêtes de mise à jour Task‑Master (coordinateur)
Merci d’actualiser les statuts suivants conformément aux livrables ci‑dessus:

- 7.2 SPEC (Auth + 401/403): passer en `review`.
- 14.1 SPEC (ENVs + /health,/ready): passer en `review`.
- 8.5 SPEC (Interfaces adaptateurs + erreurs): passer en `review`.
- 18.1 SPEC (GPU-only enforcement): passer en `review`.
- 14.4 AUDIT (Conformité TECHNICAL_GUIDELINES – santé/ready): passer en `review`.
- 7.5 AUDIT (Parité sécurité/headers): passer en `review`.

Si le CLI Task‑Master adresse les sous‑tâches individuellement, utiliser la notation `TM-<epic>.<sub>` (ex.: 7.2, 14.1, 8.5, 18.1, 14.4, 7.5) ou les IDs internes de sous‑tâche correspondants.

## Vérifications à exécuter (coordinateur)
- Contrôle OpenAPI: charger `docs/spec/openapi.yaml` dans Swagger Editor; vérifier la présence des réponses `403` sur les webhooks et la cohérence des schémas.
- Validateur claims/audit:
  - Exécuter: `node scripts/validate-claims-audit.mjs`
  - Corriger si nécessaire (front‑matter, nommage, présence `#TEST:`, section `## Limitations`).

## Prochaines étapes proposées
- Option A (préférée): me confier 10 (Logging & errors) — SPEC puis AUDIT, pour verrouiller le modèle d’erreur et la journalisation corrélée (`correlation_id`).
- Option B: lancer la revue des SPEC rédigées (7.2, 14.1, 8.5, 18.1) et créer des tickets IMPL/TEST correspondants en `in-progress` après validation.

## Action demandée
- Merci de réaliser la mise à jour des statuts dans Task‑Master décrite ci‑dessus.
- À défaut, merci d’indiquer l’alternative souhaitée (ex.: prioriser une autre SPEC/AUDIT ou demander des ajustements sur celles transmises).

