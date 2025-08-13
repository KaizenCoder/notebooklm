# Frontend — Plan de Développement Détaillé (Local Parity)

## Objectif
Atteindre la parité stricte avec le frontend original en branchant les Supabase Edge Functions vers l’orchestrateur local, sans aucune modification d’UX.

## Hypothèses & Contraintes
- Orchestrateur local: http://127.0.0.1:8000
- Secrets Edge uniquement: `NOTEBOOK_GENERATION_AUTH=Bearer test`
- Supabase local: `SUPABASE_URL=http://127.0.0.1:54321`, Postgres `127.0.0.1:54322`
- Modèles Ollama: `qwen2.5` (LLM), `nomic-embed-text` (embeddings)
- Pas d’endpoints cloud, parité stricte de schéma et de contrats

## Découpage par Lots (Semaine type 4–6 jours)

### Lot 1 — Setup & Sanity (0.5 j)
- Installer deps FE; config `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Déployer Edge Functions nécessaires (send-chat-message, process-document, process-additional-sources, generate-notebook-content, generate-audio-overview, callbacks)
- Sanity `/health` + `/ready` côté BE; vérif secrets Edge

### Lot 2 — Chat (0.75 j)
- Brancher `send-chat-message` → `/webhook/chat`
- Affichage réponses + citations; persistance historique; Realtime sur `n8n_chat_histories`
- Logs: `RAG_START`/`RAG_COMPLETE` visibles

### Lot 3 — Ingestion Document (1.0 j)
- UI upload → `process-document` (202) → callback → statut `sources`
- Idempotence: `Idempotency-Key` (tests répétés)
- Evidence: logs EXTRACT/EMBED/UPSERT; DB transitions `processing→completed`

### Lot 4 — Sources Additionnelles (0.75 j)
- `copied-text`: contenu → `.txt` → indexation
- `multiple-websites`: URLs → fetch → `.txt` → indexation
- Evidence: mise à jour `sources`, chunks méta (notebook_id, source_id, loc.lines)

### Lot 5 — Audio (0.75 j)
- `generate-audio-overview` → génération → callback → URL jouable
- Player FE opérationnel; champs notebook mis à jour

### Lot 6 — Stabilisation & Parité (0.5–1.0 j)
- Tests E2E manuels guidés par checklist
- Corrections UI mineures, perf (lazy-loading si nécessaire)
- Collecte d’évidences (captures FE, logs corrélés, extraits DB)

## Critères de Sortie Par Lot
- Chat: réponse avec citations, insertion Realtime confirmée
- Ingestion: 202 + callback reçu + statut final en DB
- Sources additionnelles: entrées/updates `sources` + indexation visible
- Audio: URL jouable + expiration gérée (si applicable)

## Risques & Mitigations
- Variation contrats BE: verrouiller via `docs/spec/openapi.yaml` et tests manuels ciblés
- GPU indisponible: retirer `GPU_ONLY` pour dev; réactiver pour validation parité
- Secrets exposés: validation statique; rappel “Edge-only”

## Suivi & Gouvernance
- Lier chaque lot à un ID Task‑Master
- Revue hebdo parité; journaliser décisions dans `docs/DECISIONS.md`


## Règles Opérationnelles (Obligatoires)
- Binôme implémenteur/auditeur: chaque lot est réalisé en couple; l’auditeur valide avant passage au lot suivant.
- Test‑First: écrire les tests (contrat/intégration) avant ou en parallèle immédiat de l’implémentation; pas de livraison sans tests verts.
- Parallélisation maximale: FE avec mocks contractuels pendant que le BE stabilise les webhooks; lots pouvant s’exécuter en parallèle sont lancés en priorité.
- Publication Redis obligatoire:
  - Avant toute Claim (`claims/`): publier `STATUS_UPDATE` sur `agents:pair:<team>` avec liens de preuve/PR.
  - Pour tout Audit (`audit/`): `AUDIT_REQUEST` (impl→audit) puis `AUDIT_VERDICT` (audit→impl) sur `agents:pair:<team>`.
- Gates d’avancement: une tâche/lot ne passe à l’étape suivante qu’après validation explicite par l’auditeur (preuve tracée dans la PR et les logs Redis).

## Référence Continue au Modèle à Cloner (Obligatoire)
- Chaque lot inclut une tâche "Citer la source" listant les fichiers d’origine sous `docs/clone/...` (chemins + brève justification).
- Les PR de lots doivent contenir:
  - Bloc "Source originale" (liens/chemins vers le clone)
  - Bloc "Adaptations validées" (si besoin) avec lien `docs/DECISIONS.md`
  - Bloc "Preuves #TEST:" (logs/screenshots/diffs) corrélées au modèle d’origine

## Spécificités Validées par la Vision du Projet
- Parité stricte de comportements et de contrats; aucune innovation UX.
- Posture locale stricte (DB locale + Supabase local); pas d’accès cloud.
- Webhooks via Orchestrator en remplacement de n8n (mêmes routes/payloads).
- Secrets uniquement côté Edge; `NOTEBOOK_GENERATION_AUTH="Bearer test"` en local.
- Bus Redis multi‑flux obligatoire (heartbeats, status updates, audits).


