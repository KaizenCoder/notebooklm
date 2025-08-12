# Questions de Cadrage — InsightsLM Local (sans n8n)

Date: 2025-08-11
But: centraliser toutes les questions de clarification avant implémentation. Cochez au fur et à mesure des réponses.

Décision par défaut
- Par quasi-tous les sujets, la réponse est: CLONE (parité stricte avec la version originale). Les items restants sont marqués « À confirmer ».

## Vision et parité
- [ ] Quelle version de référence des repos originaux (commit/sha tags) sert de base de parité pour FE et package local ? (À confirmer)
- [x] La parité est strictement 1:1, y compris statuts HTTP et structures de réponse. Décision: CLONE (comme original).

## Environnement et plateformes
- [x] Cible OS: alignée sur l’original (multi‑OS si supporté; Windows via Docker Desktop inclus). Décision: CLONE.
- [x] GPU‑only: même exigence que l’original (pas de fallback CPU). Décision: CLONE.
- [ ] Windows: standardiser `D:/modeles_llm` ou laisser configurable ? (Variante documentée; choix d’implémentation locale à confirmer)

## Base de données et Supabase
- [x] Utilisation de Supabase local (adossé à PostgreSQL local) comme l’original; sinon accès direct PostgreSQL local lorsque pertinent. Décision: CLONE.
- [x] Schéma SQL importé tel quel (RLS/Policies/Indexes inchangés). Décision: CLONE.
- [x] RPC (ex: `match_documents`) reproduits à l’identique (noms, signatures). Décision: CLONE.

## Orchestrateur (stack, packaging)
- [x] Stack Node/TypeScript alignée avec l’original; framework HTTP au choix tout en respectant les contrats. Décision: CLONE.
- [ ] Exposition réseau: interne Docker uniquement vs port hôte pour dev/E2E ? (À confirmer)
- [ ] Génération de squelettes à partir d’OpenAPI et tests contrat auto (process interne, non présent dans l’original) ? (À confirmer)

## Contrats d’API et flux métiers
- [x] Source of truth: comportement de l’original (Edge Functions + payloads). OpenAPI reflète l’original. Décision: CLONE.
- [x] Codes de réponse asynchrones: identiques à l’original (notebook-content en 202; le reste selon original). Décision: CLONE.
- [ ] Idempotence: alignement strict sur l’original ou ajout d’Idempotency-Key comme dans les guidelines ? (À confirmer)

## Traitements IA et paramètres
- [x] Modèles par défaut: mêmes que l’original (LLM, embeddings). Décision: CLONE.
- [x] Chunking: taille/overlap/tokéniseur comme l’original. Décision: CLONE.
- [x] Retrieval: Top‑K et seuils comme l’original. Décision: CLONE.
- [x] ASR/TTS: langues/voix/format audio identiques à l’original. Décision: CLONE.

## Fichiers et Storage
- [x] Stockage: mêmes conventions que l’original (Supabase Storage local/buckets/chemins). Décision: CLONE.
- [x] Multiple-websites: 1‑to‑1 URL→sourceId et .txt comme l’original. Décision: CLONE.

## Sécurité et réseau
- [x] Secret `NOTEBOOK_GENERATION_AUTH`: gestion conforme à l’original (server-side only). Décision: CLONE.
- [x] Réseau: accès interne Edge→API; pas d’exposition publique, comme l’original. Décision: CLONE.
- [x] CORS: identique à l’original (Edge comme unique client). Décision: CLONE.

## Erreurs, logs, observabilité
- [ ] Modèle d’erreur structuré et `correlation_id`: aligner strictement sur l’original ou adopter le modèle proposé dans les guidelines ? (À confirmer)
- [x] Logs: niveau et format comme l’original; pas d’ajout non justifié. Décision: CLONE.
- [ ] `/health` et `/ready`: critères exacts à calquer sur l’original ou à préciser (GPU/modèles). (À confirmer)

## Tests et critères d’acceptation
- [ ] Top 3 scénarios E2E prioritaires pour revue de parité (à confirmer).
- [x] Objectifs de latence/tailles: suivre l’original (pas d’objectifs nouveaux). Décision: CLONE.
- [ ] Tests contractuels auto‑générés depuis OpenAPI + fixtures en CI (process interne). (À confirmer)

## Gouvernance et outillage
- [ ] Seed du fichier `.taskmaster/tasks.json` (épics + sous‑tâches) maintenant ? (À confirmer)
- [x] Revue de parité hebdo avec mise à jour `DECISIONS.md` + `CHECKLIST`: Décision: CLONE (processus maintenu).

## Déploiement et DX
- [ ] Script d’installation « one‑shot » vs documentation pas‑à‑pas (À confirmer).
- [ ] Profil « dev » avec mocks pour FE (À confirmer).

---

Notes complémentaires
- Ce document s’appuie sur: `docs/PRD.md`, `docs/ORCHESTRATOR_IMPLEMENTATION_PLAN.md`, `docs/TECHNICAL_GUIDELINES.md`, `docs/spec/*`, `docs/WEBHOOKS_MAPPING.md`, `docs/ANNEXES_PAYLOADS.md`.
- Objectif: verrouiller les décisions avant SPEC→IMPL pour assurer la parité stricte et éviter les retours.
