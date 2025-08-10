# PRD — Clone InsightsLM Local (sans n8n)

Version: 0.1 (brouillon)
Auteur: Projet NotebookLM Local
Dernière mise à jour: 2025-08-10

## Sommaire
- [1. Vision](#sec-1-vision)
- [2. Objectifs & Critères de succès (V1)](#sec-2-objectifs)
- [3. Personas & Cas d’usage](#sec-3-personas)
- [4. Portée (Scope)](#sec-4-portee)
- [5. Contraintes & Hypothèses](#sec-5-contraintes)
- [6. Données & Schéma](#sec-6-donnees)
- [7. API & Intégrations](#sec-7-api)
- [8. Exigences Fonctionnelles (détail)](#sec-8-fonctionnel)
- [9. Exigences Non Fonctionnelles](#sec-9-non-fonctionnel)
- [10. Plateformes & Dépendances](#sec-10-plateformes)
- [11. Déploiement & Installation](#sec-11-deploiement)
- [12. Tests & Acceptation](#sec-12-tests)
- [13. Roadmap](#sec-13-roadmap)
- [14. Risques & Atténuations](#sec-14-risques)
- [15. Ouverts / À clarifier](#sec-15-ouverts)
- [16. Jalons & Planning (Milestones)](#sec-16-jalons)
- [17. RACI (rôles et responsabilités)](#sec-17-raci)
- [18. Plan de tests détaillé](#sec-18-plan-tests)
- [19. Références croisées](#sec-19-references)

<a id="sec-1-vision"></a>
## 1. Vision
- Offrir un clone local et privé du dépôt « insights-lm-local-package » avec parité fonctionnelle stricte, en remplaçant uniquement n8n par une API locale (pas d’autres changements de design ou de fonctionnalités).
- Usage ciblé: mono‑utilisateur (usage personnel) sur Windows, avec GPU NVIDIA (RTX 3090). Exécution locale, hors‑cloud, avec tolérance au téléchargement initial des modèles.
- Langue cible: français (contenus et interface). 

<a id="sec-2-objectifs"></a>
## 2. Objectifs & Critères de succès (V1)
- Parité: correspondance 1:1 des fonctionnalités du repo d’origine (hors n8n) — même UX et comportements attendus.
- Fonctionnel complet: ingestion, indexation vectorielle, chat RAG avec citations.
- Environnement: exécution locale sous Windows avec utilisation exclusive du GPU RTX 3090 (CPU interdit pour l’inférence/embeddings).
- Offline: après téléchargement initial des modèles, fonctionnement hors ligne.
- Succès V1: « fonctionnalités totales, complètes et à l’identique du repo cloné ».

Indicateurs (à préciser):
- Temps d’indexation (TBD), latence de réponse (TBD), stabilité (TBD), tdb logs étape‑par‑étape (TBD).

<a id="sec-3-personas"></a>
## 3. Personas & Cas d’usage
- Persona principal: unique utilisateur (propriétaire du poste). Niveau technique non précisé.
- Cas d’usage prioritaires:
  - Questions‑réponses contextualisées à partir de sources indexées (RAG).
  - Résumé de contenu.
  - Synthèse multi‑sources (ensemble d’articles).
  - Note: lecture pas à pas d’un PDF n’est pas une priorité explicitement demandée (mais la parité inclut l’ingestion de PDF).

<a id="sec-4-portee"></a>
## 4. Portée (Scope)
- Inclus (V1):
  - Ingestion sources avec parité complète du dépôt: PDF, texte, sites web, (audio en V1.1, voir Roadmap).
  - Indexation: chunking avec overlap et embeddings via Ollama `nomic-embed-text` (par défaut), conforme à l’original.
  - Recherche: pgvector (table `documents`) + RPC `match_documents` (parité SQL d’origine).
  - Chat RAG: citations obligatoires (indices + mapping source_id/loc.lines).
  - Remplacement strict de n8n par une API locale (interfaces équivalentes côté Edge Functions non exigées — voir Compatibilité).
- Exclus (V1):
  - Génération audio (Coqui TTS) — reportée V1.1.
  - Transcription audio (Whisper ASR) — reportée V1.1.
  - Export Insights (Markdown/JSON) — reporté V1.1.

<a id="sec-5-contraintes"></a>
## 5. Contraintes & Hypothèses
- OS & Matériel: Windows, GPU NVIDIA RTX 3090. GPU‑only (CPU interdit pour inference/embeddings).
- Modèles LLM/Embeddings:
  - Emplacement local: `D:\\modeles_llm\\` (tous les modèles doivent être présents ou téléchargés dans ce dossier).
  - Modèle par défaut chat: paramétrable; parité initiale avec `qwen3:8b-q4_K_M` recommandée.
  - Embeddings: `nomic-embed-text` via Ollama (parité d’origine).
- Offline: tolérance au téléchargement initial des modèles, puis fonctionnement offline.
- Licence: MIT (alignée avec dépôt d’origine).

<a id="sec-6-donnees"></a>
## 6. Données & Schéma
- Base: PostgreSQL (Supabase local). 
- Schéma: parité avec le SQL fourni (notebooks, sources, notes, n8n_chat_histories, documents, RLS, RPC `match_documents`).
- Historique chat: conserver `n8n_chat_histories` avec messages JSON (parité format).
- Stockage: buckets `sources` (privé) et `audio` (privé) identiques, règles RLS identiques.

<a id="sec-7-api"></a>
## 7. API & Intégrations
- Remplacement n8n: par une API locale (orchestrateur), endpoints conceptuellement équivalents à:
  - `POST /webhook/process-document` (extraction + index + callback)
  - `POST /webhook/process-additional-sources` (copied‑text / multiple‑websites)
  - `POST /webhook/chat` (RAG + citations)
  - `POST /webhook/generate-audio` (déplacé V1.1)
- Compatibilité Edge Functions: non strictement requise côté I/O (réponse fournie: « non »). Néanmoins, dans l’esprit de parité, les structures d’échange resteront très proches pour minimiser l’écart.
- Variables d’environnement: remplacer uniquement les `*_WEBHOOK_URL` qui pointaient vers n8n pour cibler l’API locale. 
- Observabilité: logs par étape (ingestion, embeddings, upsert, retrieval, génération).

<a id="sec-8-fonctionnel"></a>
## 8. Exigences Fonctionnelles (détail)
- Ingestion/Indexation:
  - PDF/texte/sites web, parité du flux d’origine.
  - Chunking: taille/overlap similaires à l’original (overlap ~200), numérotation des spans pour citations.
  - Embeddings: via Ollama `nomic-embed-text` avec batch et gestion GPU.
  - Métadonnées: `metadata = { notebook_id, source_id, loc.lines.from, loc.lines.to }`.
- Chat RAG:
  - Requête de recherche (LLM) → embedding de requête → RPC `match_documents` filtré par `notebook_id`.
  - Réponse LLM au format JSON avec citations `[n]` puis post‑traitement pour produire `{ text, citations[] }`.
- Paramètres modèles:
  - Chemin `D:\\modeles_llm\\` pour Ollama (ou équivalent configuration) — tous les modèles y résident.
  - Modèles paramétrables (sélection possible par l’utilisateur technique), valeur par défaut alignée dépôt.

<a id="sec-9-non-fonctionnel"></a>
## 9. Exigences Non Fonctionnelles
- Performance (cibles initiales ajustables):
  - Indexation PDF ~50 pages: < 5–8 minutes avec embeddings sur GPU (aucun fallback CPU).
  - Latence chat: question simple < 3–5 s; question complexe < 10–15 s.
  - Utilisation GPU visible pendant embeddings/LLM (vérifiée via nvidia-smi).
  - Remarque: ces cibles sont initiales et seront ajustées après les premiers runs de mesure.
- Robustesse: gestion des erreurs par étape; reprises possibles (TBD).
- Sécurité: contexte mono‑utilisateur; API accessible localement (réseau Docker local). Auth par header minimale est acceptable.
- Localité des données: aucun envoi vers le cloud après installation initiale.
- Journalisation: logs par étape activables; niveau configurable (info/debug).

<a id="sec-10-plateformes"></a>
## 10. Plateformes & Dépendances
- OS: Windows.
- GPU: RTX 3090 (CUDA). 
- Services: Supabase local (Postgres + Storage + Edge Functions), Ollama, (Whisper/Coqui en V1.1).
- Outils: Docker Desktop requis pour l’infrastructure locale.
 - Modèles (stockage): convention retenue proche du repo d’origine — volume Docker nommé pour les modèles (Ollama), alternative: montage d’un chemin Windows si nécessaire.

<a id="sec-11-deploiement"></a>
## 11. Déploiement & Installation
- Mode Clone (sans n8n): suivre la doc d’installation existante, en remplaçant uniquement les URLs webhook vers l’API locale. 
- Emplacement des modèles: `D:\\modeles_llm\\` (les modèles doivent être présents ou téléchargés à cet emplacement).
- Script de démarrage: (TBD) script unique vs documentation manuelle — à confirmer.

<a id="sec-12-tests"></a>
## 12. Tests & Acceptation
- Jeux d’essai (TBD):
  - PDF(s) type (FR), pages variées.
  - Articles web (FR) pour synthèse multi‑sources.
  - Questions de validation et vérification des citations (source_id + lignes).
- Critères d’acceptation V1:
  - Parité des fonctionnalités du dépôt original (hors audio, transcription, export qui passent en V1.1).
  - Citations précises et vérifiables.
  - Exécution locale avec GPU utilisé (pas de fallback CPU pour inference/embeddings).

<a id="sec-13-roadmap"></a>
## 13. Roadmap
- V1 (parité sans n8n):
  - Ingestion (PDF/texte/web), indexation, chat RAG + citations, remplacement pur de n8n par API locale, FR.
- V1.1:
  - Génération audio (Coqui), transcription (Whisper), exports (Markdown/JSON).
  - Éventuels jobs asynchrones/file (si nécessaire) et logs enrichis.
- V1.2:
  - Formats avancés (DOCX/HTML enrichi), UI d’admin (optionnel), tuning performance et UX.

<a id="sec-14-risques"></a>
## 14. Risques & Atténuations
- Performance GPU vs taille modèles: prévoir modèles quantifiés si besoin (TBD benchmarks).
- Ambiguïté compat Edge I/O: même si non requise, rester proche pour limiter le risque d’intégration (atténuation: adapter si besoin).
- Gestion des modèles locaux sur Windows (chemin fixe): documenter clairement et vérifier droits d’accès.

<a id="sec-15-ouverts"></a>
## 15. Ouverts / À clarifier
- Cibles de performance (indexation/latence) — à définir.
- Script d’installation unique vs docs — à décider.
- Scénarios de tests d’acceptation — à lister précisément.

---

- Notes de provenance:
- Réponses utilisateurs collectées depuis `../reponse_prd.txt`.
- Analyses complémentaires: `ANALYSE_SANS_N8N.md`, `DOCUMENTATION_PROJET.md`.
 
<a id="sec-16-jalons"></a>
## 16. Jalons & Planning (Milestones)
- M0 — Cadrage PRD (fait):
  - Livrables: PRD v0.1 (vision, scope, exigences), docs d’analyse.
- M1 — Spécifications figées (S):
  - Livrables: PRD v1.0 (sections perf/acceptation consolidées), choix script d’installation vs doc.
- M2 — Clone infra sans n8n (S+1):
  - Livrables: env `.env` mis à jour (URLs webhook → API locale placeholder), docker-compose sans n8n, Supabase migration et Edge Functions en place.
- M3 — Design API Orchestrator (S+2):
  - Livrables: spécification endpoints définitive, contrats I/O, schémas d’erreurs, journalisation.
- M4 — Implémentation V1 (S+4 à S+6):
  - Livrables: ingestion/indexation, chat RAG + citations, tests et critères d’acceptation V1.
- M5 — V1.1 Audio/Transcription/Exports (S+8):
  - Livrables: Coqui TTS, Whisper ASR, exports MD/JSON, tests associés.

Remarque: S = semaine de référence; dates exactes à caler.

<a id="sec-17-raci"></a>
## 17. RACI (rôles et responsabilités)
Rôles
- Product Owner (PO) — vous (mono‑utilisateur)
- Tech Lead (TL)
- Backend (BE)
- Infra/DevOps (OPS)
- Qualité (QA)
- Documentation (DOC)

Activités clés
- Exigences & priorisation: R(PO), A(PO), C(TL), I(BE,OPS,QA,DOC)
- Architecture & design API: R(TL), A(TL), C(BE,OPS,PO), I(QA,DOC)
- Configuration infra (docker, env, Supabase): R(OPS), A(TL), C(BE), I(PO,QA)
- Implémentation ingestion/indexation: R(BE), A(TL), C(OPS), I(QA,PO)
- Implémentation chat RAG + citations: R(BE), A(TL), C(OPS), I(QA,PO)
- Intégrations Ollama/Whisper/Coqui: R(BE), A(TL), C(OPS), I(QA)
- Tests & validation: R(QA), A(PO), C(BE,OPS), I(TL)
- Documentation (utilisateur/technique): R(DOC), A(PO), C(TL,BE), I(OPS,QA)
- Release & déploiement local: R(OPS), A(TL), C(BE), I(PO,QA)

<a id="sec-18-plan-tests"></a>
## 18. Plan de tests détaillé
Stratégie
- Tester en priorité les flux modifiés par le remplacement de n8n: webhooks, ingestion, indexation, retrieval, citations.
- Couvrir environnement Windows + GPU RTX 3090, offline après installation.

Jeux de données
- PDF FR courts et longs (texte sélectionnable, encodages variés).
- Textes bruts (.txt) multi‑pages.
- Sites web (captures HTML/MD) — idéalement snapshots locaux pour offline.
- Ensemble multi‑sources cohérent pour tester citations croisées.

Vérifications d’environnement
- GPU: présence CUDA, usage GPU confirmé (pas de fallback CPU) lors des embeddings/LLM.
- Modèles présents sous `D:\\modeles_llm\\` ou téléchargement initial réussi.
- Supabase: schéma appliqué (tables, RLS, RPC `match_documents`).

Tests d’ingestion & indexation
- PDF: extraction fidèle (pas de caractères manquants), normalisation, découpage (overlap ~200), dimension d’embedding 768.
- Texte: pass‑through + chunking identique au PDF.
- Web: conversion HTML→Markdown stable, extraction du titre, stockage bucket `.txt` conforme.
- Métadonnées: pour chaque chunk, `metadata.notebook_id`, `metadata.source_id`, `metadata.loc.lines.from/to` présents et plausibles.
- Échecs: gestion erreurs (fichier corrompu, type non supporté) → logs explicites, pas de crash global.

Tests de recherche & RAG
- Recherche: filtre par `notebook_id` effectif, topK raisonnable, déduplication par source le cas échéant.
- Prompting: réponses strictement fondées sur les chunks; "je ne sais pas" si absence de preuve.
- Citations: format `[n]` en sortie LLM; post‑traitement produit `citations[]` correctes (source_id + lignes) et alignées au texte.

Tests de performance (TBD valeurs)
- Indexation: PDF 50 pages < cible X minutes (GPU), stable sur 3 runs.
- Latence chat: question simple < cible Y s; question complexe < cible Z s.
- Utilisation GPU: embeddings et génération montrent une occupation GPU > seuil T (via nvidia-smi).

Tests de sécurité & offline
- Auth: header obligatoire accepté/refusé correctement.
- Portée réseau: API non exposée publiquement (réseau local Docker uniquement).
- Offline: après installation, débrancher réseau et vérifier ingestion texte, recherche, chat (hors fetch web bien sûr).

Journaux & observabilité
- Chaque étape loggée (ingestion, embeddings, upsert, retrieval, génération) avec corrélation d’un run.
- Logs d’erreur actionnables (pile, cause).

Critères d’acceptation V1 (compléments)
- Parité fonctionnelle atteinte (hors audio, transcription, exports → V1.1).
- Citations vérifiables et correctement mappées aux sources/lignes.
- GPU utilisé pour embeddings/LLM; aucun calcul d’inférence sur CPU.
- Fonctionnement offline après installation initiale.

Sorties de tests
- Rapport test (checklist passée/KO), journaux, éventuels artefacts d’export (si activés en V1.1).

## 19. Références croisées
- Checklist d’exécution des tests V1: `CHECKLIST_TESTS_V1.md`
- Modèle de rapport de tests V1: `TEST_REPORT_V1.md`

## 20. Contrats d’API (V1) + Idempotence — M1 GELÉ (2025-08-10)

Objectif: geler les interfaces de l’API Orchestrator remplaçant n8n pour la V1 (ingestion/indexation, sources additionnelles, chat), incluant sécurité, erreurs et idempotence.

Sécurité & en-têtes communs
- Auth obligatoire: `Authorization: Bearer ${NOTEBOOK_GENERATION_AUTH}` → 401 si absent/incorrect.
- Content-Type: `application/json` (sauf upload audio V1.1).
- Corrélation (optionnel): `X-Correlation-Id: <uuid>` renvoyé tel quel dans la réponse.
- Idempotence (ingestion): `Idempotency-Key: <string>` (header) ou `idempotency_key` (body).

Modèle d’erreur standard
```json
{
  "code": "string",           // ex: "BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "CONFLICT", "UNPROCESSABLE", "INTERNAL"
  "message": "string",        // message court et clair
  "details": {},               // optionnel: informations additionnelles
  "correlation_id": "uuid"    // si fourni via X-Correlation-Id, sinon généré côté serveur
}
```
Codes & sémantique
- 200/202: succès (202 possible si traitement async accepté).
- 400: validation invalide (schéma, types, champs manquants).
- 401: auth manquante/incorrecte.
- 404: ressource inexistante (notebook/source introuvable).
- 409: conflit/idempotence (requête déjà traitée pour la même clé ou doublon détecté).
- 422: type non supporté (extraction impossible).
- 500: erreur interne.

Endpoints

1) POST /webhook/process-document
- But: extraire → résumer/titrer → chunker → embed → upsert `documents` → callback (si fourni).
- Requêtes (une des deux formes):
```json
{ "source_id": "uuid", "notebook_id": "uuid", "file_path": "string", "source_type": "pdf|text|audio|web", "callback_url": "string (optional)", "idempotency_key": "string (optional)" }
```
```json
{ "source_id": "uuid", "notebook_id": "uuid", "extracted_text": "string", "idempotency_key": "string (optional)" }
```
- Réponse (succès):
```json
{ "success": true, "job_id": "uuid", "status": "pending|processing|completed|failed" }
```
- Notes:
  - Idempotence: si même (source_id + hash_contenu) est déjà traité avec la même clé, renvoyer 409 avec référence au job existant; si même contenu sans clé, le service peut rejouer mais doit éviter les doublons via hash/clé unique logique.
  - Métadonnées `documents.metadata`: `{ notebook_id, source_id, loc: { lines: { from, to } }, chunk_id }`.

2) POST /webhook/process-additional-sources
- But: ajouter des sources hors fichiers (copied-text) ou un lot de sites (snapshots/MD → texte), puis indexation.
- Requêtes:
```json
{ "type": "copied-text", "notebook_id": "uuid", "source_id": "uuid", "title": "string (optional)", "content": "string" }
```
```json
{ "type": "multiple-websites", "notebook_id": "uuid", "source_ids": ["uuid"], "urls": ["string"] }
```
- Réponse:
```json
{ "success": true }
```

3) POST /webhook/chat
- But: RAG sur un notebook avec citations vérifiables; persister l’historique.
- Requête:
```json
{ "session_id": "uuid", "user_id": "uuid", "message": "string", "top_k": 8 }
```
- Réponse (succès):
```json
{
  "success": true,
  "data": {
    "output": [
      {
        "text": "string",
        "citations": [ { "source_id": "uuid", "lines": { "from": 10, "to": 18 } } ]
      }
    ]
  }
}
```
- Règles:
  - Le LLM produit des marqueurs `[n]`; l’API mappe ces indices aux `chunk_id` réellement récupérés, et fabrique `citations[]` (source_id + lines.from/to) cohérentes.
  - Si absence de contexte probant, la réponse doit explicitement contenir « je ne sais pas ».

Idempotence & déduplication (ingestion)
- Clé: `Idempotency-Key` recommandée pour toute ingestion.
- Détection de doublons: hash (SHA‑256) du texte normalisé par chunk, clé logique UNIQUE (source_id, chunk_id).
- Politique de réémission: en cas de re‑post avec même clé et payload identique → renvoyer la réponse précédente (ou 409 avec référence). Payload différent avec même clé → 409.

Observabilité
- Logs JSON structurés par requête: `timestamp, level, correlation_id, phase, source_id, notebook_id, latency_ms`.
- Timeouts et retries (max 2) sur dépendances (Ollama/Supabase/Storage) avec backoff.

Statut
- Cette section est GELÉE pour M1 à la date du 2025-08-10.
