<!-- Déplacé sous docs/ -->
# Rapport de tests — V1 Clone InsightsLM Local (sans n8n)

Références croisées: voir `PRD.md` (exigences et critères) et `CHECKLIST_TESTS_V1.md` (checklist d’exécution).

Date du run: __/__/____  Heure: __:__  Auteur: __________

## 1) Métadonnées & Environnement
- OS: Windows [10/11]  Build: __________
- GPU: NVIDIA RTX 3090 (pilotes/CUDA): __________
- Docker Desktop: version __________
- Supabase local: [OK/KO]  URL: __________
- Emplacement modèles LLM/Embeddings: `D:\\modeles_llm\\` (ou volume mappé): [OK/KO]
- API Orchestrator (remplacement n8n): URL base __________  Auth header: [OK/KO]
- Variables d’env (`*_WEBHOOK_URL`, `NOTEBOOK_GENERATION_AUTH`): [OK/KO]

## 2) Jeux de test utilisés
- PDF court (`test_short.pdf`): chemin __________  Pages: ~__  Langue: FR
- PDF long (`test_long.pdf`): chemin __________  Pages: ~__  Langue: FR
- Texte brut (`test_text.txt`): chemin __________
- Pages web (snapshots): `page1.html/.md`, `page2.html/.md` — chemins __________
- Questions (liste 5–10): fichier/référence __________

## 3) Vérifications d’environnement
- GPU utilisé (nvidia-smi) pendant embeddings/chat: [OK/KO]  Preuve (capture/lien): __________
- Chargement modèles depuis `D:\\modeles_llm\\`: [OK/KO]
- Supabase accessible, RPC `match_documents` exécutable: [OK/KO]

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

## 9) Performance (informative, cibles TBD)
- Indexation `test_long.pdf` (min:s): ______  GPU charge observée: ______
- Latence chat Q simple (s): ______  Q complexe (s): ______
- Observations/metrics: __________

## 10) Sécurité & Offline
- Auth webhook (header manquant → refus): [OK/KO]
- API non exposée publiquement (réseau local): [OK/KO]
- Offline (réseau coupé après installation modèles):
  - Ingestion texte: [OK/KO]
  - Recherche + Chat: [OK/KO]
  - Observations: __________

## 11) Journaux & Observabilité
- Traces par étape (ingestion, embeddings, upsert, retrieval, génération): [OK/KO]
- Erreurs explicites sans crash global: [OK/KO]
- Extraits utiles (liens/captures): __________

## 12) Synthèse & Décision d’acceptation V1
- Parité fonctionnelle (hors audio/transcription/exports V1.1): [OK/KO]
- Citations vérifiables (mapping sources/lignes correct): [OK/KO]
- GPU utilisé exclusivement en inférence/embeddings: [OK/KO]
- Offline après installation initiale: [OK/KO]

Décision: [ACCEPTÉ / ACCEPTÉ AVEC RÉSERVES / REFUSÉ]
Réserves/actions correctives (si besoin):
- Item 1: __________  Responsable: ____  Échéance: ____
- Item 2: __________  Responsable: ____  Échéance: ____

Annexes (captures, logs, mesures):
- __________
