<!-- Déplacé sous docs/ -->
# Rapport de tests — V1 Clone InsightsLM Local (sans n8n)

Références croisées: voir `PRD.md` (exigences et critères) et `CHECKLIST_TESTS_V1.md` (checklist d’exécution).

Date du run: __/__/____  Heure: __:__  Auteur: __________

## 1) Métadonnées & Environnement
- OS / Build: __________
- Matériel (CPU/GPU): __________
- Docker Desktop: version __________
- PostgreSQL locale (pgvector): [OK/KO]  Connexion DSN: __________
- Supabase local (optionnel): [OK/KO]  URL: __________ (doit pointer sur la PostgreSQL locale)
- Emplacement modèles LLM/Embeddings: `D:\\modeles_llm\\` (ou volume mappé): [OK/KO]
- API Orchestrator (remplacement n8n): URL base __________  Auth header: [OK/KO]
- Variables d’env (`*_WEBHOOK_URL`, `NOTEBOOK_GENERATION_AUTH`): [OK/KO]
- Gouvernance: Tag Task‑Master: __________  Tâches couvertes (SPEC/IMPL/TEST/AUDIT): __________

## 2) Jeux de test utilisés
- PDF court (`test_short.pdf`): chemin __________  Pages: ~__  Langue: FR
- PDF long (`test_long.pdf`): chemin __________  Pages: ~__  Langue: FR
- Texte brut (`test_text.txt`): chemin __________
- Pages web (snapshots): `page1.html/.md`, `page2.html/.md` — chemins __________
- Audio ASR (`sample_audio_fr.*`): chemin __________  Durée: ~__  Langue: FR
- Texte TTS (fichier/contenu): chemin/référence __________
- Questions (liste 5–10): fichier/référence __________

## 3) Vérifications d’environnement
- GPU utilisé (nvidia-smi) pendant embeddings/chat: [OK/KO]  Preuve (capture/lien): __________
- Chargement modèles depuis `D:\\modeles_llm\\`: [OK/KO]
- PostgreSQL locale accessible, RPC/SQL `match_documents` exécutable: [OK/KO]

## 4) Ingestion & Indexation — PDF court
- Ajout source: [OK/KO]
- `sources.processing_status=completed`: [OK/KO]
- `summary` / `display_name` renseignés: [OK/KO]
- Fichier présent dans bucket `sources`: [OK/KO]
- `documents` (dimension 768) insérés: [OK/KO]
- Métadonnées (`notebook_id`, `source_id`, `loc.lines.from/to`): [OK/KO]
- Observations/Logs: __________

## 5) Ingestion & Indexation — PDF long
- Ajout source: [OK/KO]
- Temps total d’indexation (min:s): ______
- GPU actif (pas de fallback CPU): [OK/KO]
- `documents` insérés, métadonnées complètes: [OK/KO]
- Observations/Logs: __________

## 6) Ingestion & Indexation — Texte
- Ajout source texte: [OK/KO]
- Chunks + embeddings (768): [OK/KO]
- Métadonnées complètes: [OK/KO]
- Observations/Logs: __________

## 7) Ingestion & Indexation — Web (snapshots)
- Conversion HTML→MD et stockage `.txt`: [OK/KO]
- `sources` (titre extrait): [OK/KO]
- `documents` / embeddings: [OK/KO]
- Métadonnées complètes: [OK/KO]
- Observations/Logs: __________

## 8) Recherche & Chat RAG (citations)
- Q1 (réponse évidente, PDF court): [OK/KO]
  - Citations `[n]` présentes: [OK/KO]
  - Post-traitement `citations[]` (source_id + lignes): [OK/KO]
  - `chunk_id` valides dans le lot: [OK/KO]
  - Latence (s): ____  Logs: __________
- Q2 (sans réponse → "je ne sais pas"): [OK/KO]
  - Historique `n8n_chat_histories` (2 entrées JSON): [OK/KO]
  - Observations/Logs: __________

## 9) Transcription Audio — Whisper ASR (local)
- Source audio importée: [OK/KO]
- `sources.processing_status=completed`: [OK/KO]
- Fichier présent dans bucket `sources`: [OK/KO]
- Transcription disponible et indexée (chunks + `documents` 768): [OK/KO]
- Utilisable en chat (citations sur segments audio): [OK/KO]
- Observations/Logs: __________

## 10) Génération Audio — Coqui TTS (local)
- Déclenchement génération audio depuis notebook: [OK/KO]
- `audio_overview_generation_status=completed`: [OK/KO]
- Fichier présent dans bucket `audio`: [OK/KO]
- `audio_overview_url` et `audio_url_expires_at` valides: [OK/KO]
- Observations/Logs: __________

## 11) Performance (informative, cibles TBD)
- Indexation `test_long.pdf` (min:s): ______  GPU charge observée: ______
- Latence chat Q simple (s): ______  Q complexe (s): ______
- Observations/metrics: __________

## 12) Sécurité & Offline
- Auth webhook (header manquant → refus): [OK/KO]
- API non exposée publiquement (réseau local): [OK/KO]
- Offline (réseau coupé après installation modèles):
  - Ingestion texte: [OK/KO]
  - Recherche + Chat: [OK/KO]
  - Observations: __________

## 13) Journaux & Observabilité
- Traces par étape (ingestion, embeddings, upsert, retrieval, génération): [OK/KO]
- Erreurs explicites sans crash global: [OK/KO]
- Extraits utiles (liens/captures): __________

## 14) Parité & Décisions
- Revue de parité (date/heure): __________  Référence originale (chemins `docs/clone/...`): __________
- Écarts constatés: __________
- Décisions (lien `docs/DECISIONS.md` + IDs Task‑Master): __________

-## 14) Synthèse & Décision d’acceptation V1
- Parité fonctionnelle (selon original, audio/transcription incluses): [OK/KO]
- Citations vérifiables (mapping sources/lignes correct): [OK/KO]
- GPU utilisé exclusivement en inférence/embeddings: [OK/KO]
- Offline après installation initiale: [OK/KO]

Décision: [ACCEPTÉ / ACCEPTÉ AVEC RÉSERVES / REFUSÉ]
Réserves/actions correctives (si besoin):
- Item 1: __________  Responsable: ____  Échéance: ____
- Item 2: __________  Responsable: ____  Échéance: ____

Annexes (captures, logs, mesures):
- __________
