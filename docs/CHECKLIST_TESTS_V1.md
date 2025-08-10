<!-- Déplacé sous docs/ -->
# Checklist de tests V1 — Clone InsightsLM Local (sans n8n)

Références croisées: voir `PRD.md` (exigences et critères) et `TEST_REPORT_V1.md` (modèle de rapport).

Objectif: valider la parité fonctionnelle V1 (ingestion/indexation, chat RAG avec citations) en local, Windows + GPU RTX 3090, offline après installation initiale.

## 1) Prérequis & Environnement
- [ ] Windows 10/11 avec GPU NVIDIA RTX 3090 (pilotes + CUDA à jour)
- [ ] Docker Desktop installé et opérationnel
- [ ] Supabase local démarré (Postgres + Storage + Edge Functions via l’infra de base)
- [ ] Migration appliquée: `supabase-migration.sql` (tables, RLS, RPC `match_documents`)
- [ ] Edge Functions copiées dans `supabase/volumes/functions/` et actives
- [ ] Modèles présents sous `D:\\modeles_llm\\` (ou volume mappé) ou téléchargés au premier démarrage
- [ ] API Orchestrator (remplacement n8n) en cours d’exécution (webhooks exposés)
- [ ] `.env` à jour: `*_WEBHOOK_URL` pointent vers l’API locale; `NOTEBOOK_GENERATION_AUTH` défini

## 2) Jeux de test (préparer)
- [ ] PDF FR (court ~5 pages) à contenu clair (nom: `test_short.pdf`)
- [ ] PDF FR (long ~50 pages) (nom: `test_long.pdf`)
- [ ] Texte brut `.txt` multi‑paragraphes (nom: `test_text.txt`)
- [ ] 2 pages Web (contenu FR) sauvegardées localement en HTML/MD (ex.: `page1.html`, `page2.html` ou `.md`)
- [ ] 5–10 questions attendues (dont certaines non couvertes pour tester le « je ne sais pas »)

## 3) Vérifications d’environnement
- [ ] GPU utilisé pour embeddings/LLM (observer `nvidia-smi` pendant indexation et chat)
- [ ] Modèles chargés depuis `D:\\modeles_llm\\` (ou chemin configuré)
- [ ] Supabase accessible (UI locale), tables visibles, RPC `match_documents` exécutable

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

## 9) Performance (mesures informatives, cibles TBD)
- [ ] Indexation `test_long.pdf` < X minutes (GPU en charge)
- [ ] Latence chat (Q simple) < Y secondes; (Q complexe) < Z secondes
- [ ] Utilisation GPU visible pendant embeddings et génération

## 10) Sécurité & Offline
- [ ] Appels aux webhooks refusés sans header `Authorization` correct
- [ ] API non exposée publiquement (réseau Docker local)
- [ ] Débrancher le réseau (après installation modèles): ingestion de texte, recherche et chat fonctionnent (hors fetch web)

## 11) Journaux & Observabilité
- [ ] Chaque étape est loggée (ingestion, embeddings, upsert, retrieval, génération)
- [ ] Erreurs explicites (fichier corrompu, type non supporté) sans crash global

## 12) Acceptation finale V1
- [ ] Parité fonctionnelle atteinte (hors audio/transcription/exports reportés V1.1)
- [ ] Citations vérifiables (mapping source/lignes correct)
- [ ] GPU utilisé et aucun fallback CPU en inference/embeddings
- [ ] Fonctionnement offline après installation initiale

Notes:
- Conserver les mesures (durées, latences) et captures d’écran (GPU, logs) en annexe du rapport.
- Les tests audio/transcription/exports sont planifiés pour V1.1 (non exigés en V1).
