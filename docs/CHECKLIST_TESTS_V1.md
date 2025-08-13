<!-- Déplacé sous docs/ -->
# Checklist de tests V1 — Clone InsightsLM Local (sans n8n)

Références croisées: voir `PRD.md` (exigences et critères) et `TEST_REPORT_V1.md` (modèle de rapport).

Objectif: valider la parité fonctionnelle V1 (ingestion/indexation, chat RAG avec citations, transcription audio locale et génération audio locale) en environnement local, offline après installation initiale.

## 0) Communication inter‑agents (OBLIGATOIRE)
- [ ] Tous les agents publient leurs heartbeats via Redis Streams (`agents:pair:<team>` + `agents:global`)
- [ ] Claims: `STATUS_UPDATE` publié sur `agents:pair:<team>` avec liens de preuve/PR avant tout fichier sous `claims/` (contrôle process/CI, pas de blocage pre-commit)
- [ ] Audits: `AUDIT_REQUEST` (impl → audit) puis `AUDIT_VERDICT` (audit → impl) sur `agents:pair:<team>` avant tout fichier sous `audit/` (contrôle process/CI, pas de blocage pre-commit)
- [ ] Consommation fiable `XREADGROUP` + `XACK` avec groupes par rôle
- [ ] `correlation_id` et `pair_id` présents dans tous les messages

## 1) Prérequis & Environnement
- [ ] Environnement local conforme au package original (Docker Desktop, services locaux)
- [ ] Base de données PostgreSQL locale (pgvector) opérationnelle
- [ ] Supabase local démarré (optionnel) et pointant vers la PostgreSQL locale (Storage + Edge Functions via l’infra de base)
- [ ] Migration appliquée: SQL/migrations sur PostgreSQL local (tables, RLS, RPC `match_documents`)
- [ ] Edge Functions copiées dans `supabase/volumes/functions/` et actives
- [ ] Modèles présents (Ollama, Whisper/Coqui) selon la procédure du package original (ou téléchargés au premier démarrage)
- [ ] API Orchestrator (remplacement n8n) en cours d’exécution (webhooks exposés)
- [ ] `.env` à jour: `*_WEBHOOK_URL` pointent vers l’API locale; `NOTEBOOK_GENERATION_AUTH` défini
- [ ] Référence au repo modèle disponible (docs/clone) et utilisée pour vérifier endpoints/payloads/flux lors des tests

## 2) Jeux de test (préparer)
- [ ] PDF FR (court ~5 pages) à contenu clair (nom: `test_short.pdf`)
- [ ] PDF FR (long ~50 pages) (nom: `test_long.pdf`)
- [ ] Texte brut `.txt` multi‑paragraphes (nom: `test_text.txt`)
- [ ] 2 pages Web (contenu FR) sauvegardées localement en HTML/MD (ex.: `page1.html`, `page2.html` ou `.md`)
- [ ] Audio d’essai pour ASR (ex.: `sample_audio_fr.wav` ou `.mp3`, contenu parlé clair en FR)
- [ ] Texte d’essai pour TTS (ex.: `tts_input.txt` ou extrait de notebook)
- [ ] 5–10 questions attendues (dont certaines non couvertes pour tester le « je ne sais pas »)

## 3) Vérifications d’environnement
- [ ] GPU utilisé pour embeddings/LLM (observer `nvidia-smi` pendant indexation et chat)
- [ ] Modèles chargés depuis `D:\\modeles_llm\\` (ou chemin configuré)
- [ ] PostgreSQL local accessible (`psql`/client), tables visibles, RPC/SQL `match_documents` exécutable
- [ ] Gouvernance active: tâches Task‑Master créées pour SPEC/IMPL/TEST/AUDIT; IDs référencés dans commits/PR

## 4) Ingestion & Indexation — PDF (court)
- [ ] Ajouter une source PDF dans le notebook (frontend ou API existante)
- [ ] Vérifier mise à jour `sources`: `processing_status` passe à `completed`, `summary`/`display_name` renseignés
- [ ] Vérifier Storage: fichier présent dans le bucket `sources`
- [ ] Vérifier `documents`: embeddings créés (dimension 768), `metadata.notebook_id`/`source_id` renseignés
- [ ] Vérifier `metadata.loc.lines.from/to` sur un échantillon de chunks

## 5) Ingestion & Indexation — PDF (long)
- [ ] Répéter l’étape pour `test_long.pdf`
- [ ] Mesurer temps total d’indexation (note: valeur cible TBD)
- [ ] Vérifier qu’aucun fallback CPU n’a lieu (GPU utilisé)

## 6) Ingestion & Indexation — Texte
- [ ] Ingestion `test_text.txt` → vérifier `sources`, chunks, `documents`, métadonnées

## 7) Ingestion & Indexation — Web (snapshots locaux)
- [ ] Convertir HTML → Markdown (ou utiliser le flux existant) et stocker `.txt` dans le bucket
- [ ] Vérifier `sources` (titre extrait), `documents` (embeddings), métadonnées complètes

## 8) Recherche & Chat RAG (citations)
- [ ] Poser une question basée sur `test_short.pdf` (réponse évidente)
- [ ] Vérifier la présence de citations en fin de phrase `[n]`
- [ ] Vérifier le post‑traitement: la réponse retournée contient `citations[]` avec `chunk_source_id` et `chunk_lines_from/to`
- [ ] Vérifier que les `chunk_id` référencés existent dans le lot de chunks récupérés
- [ ] Poser une question sans réponse dans les sources → vérifier la réponse « je ne sais pas »
- [ ] Historique chat: deux entrées créées (humain puis IA) dans `n8n_chat_histories` (format JSON intact)

## 9) Transcription Audio — Whisper ASR (local)
- [ ] Importer un fichier audio (`sample_audio_fr.*`) comme source audio dans un notebook
- [ ] Vérifier `sources`: `processing_status` → `completed`, `display_name`/`summary` renseignés
- [ ] Vérifier Storage: fichier audio présent dans le bucket `sources`
- [ ] Vérifier transcription: texte extrait disponible (champ `content` ou associé), indexation effectuée (chunks + `documents` 768d, métadonnées complètes)
- [ ] Vérifier que la transcription est utilisable dans le chat (citations sur segments issus de l’audio)

## 10) Génération Audio — Coqui TTS (local)
- [ ] Déclencher la génération audio (aperçu/podcast) depuis un contenu de notebook
- [ ] Vérifier mise à jour `notebooks`: `audio_overview_generation_status` → `completed`
- [ ] Vérifier Storage: fichier audio généré présent dans le bucket `audio`
- [ ] Vérifier `audio_overview_url` et `audio_url_expires_at` (accès audio valide en local)

## 11) Performance (mesures informatives, cibles TBD)
- [ ] Indexation `test_long.pdf` < X minutes (GPU en charge)
- [ ] Latence chat (Q simple) < Y secondes; (Q complexe) < Z secondes
- [ ] Utilisation GPU visible pendant embeddings et génération

## 12) Sécurité & Offline
- [ ] Appels aux webhooks refusés sans header `Authorization` correct
- [ ] API non exposée publiquement (réseau Docker local)
- [ ] Débrancher le réseau (après installation modèles): ingestion de texte, recherche et chat fonctionnent (hors fetch web)

## 13bis) Revues de parité (hebdomadaire)
- [ ] Exécution miroir sur l’original et le clone (scénarios clés)
- [ ] Écarts relevés et documentés (payloads, statuts, mutations DB, UX)
- [ ] Décisions/écarts acceptés consignés dans `docs/DECISIONS.md` (IDs Task‑Master)

## 13) Journaux & Observabilité
- [ ] Chaque étape est loggée (ingestion, embeddings, upsert, retrieval, génération)
- [ ] Erreurs explicites (fichier corrompu, type non supporté) sans crash global

## 14) Acceptation finale V1
- [ ] Parité fonctionnelle atteinte (conforme à l’original, audio/transcription incluses)
- [ ] Citations vérifiables (mapping source/lignes correct)
- [ ] GPU utilisé et aucun fallback CPU en inference/embeddings
- [ ] Fonctionnement offline après installation initiale

Notes:
- Conserver les mesures (durées, latences) et captures d’écran (GPU, logs) en annexe du rapport.
- Les exports (Markdown/JSON) restent hors périmètre si non présents dans l’original.
