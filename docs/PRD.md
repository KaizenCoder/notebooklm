# PRD — Clone InsightsLM Local (sans n8n)

Version: 0.2 (parité stricte)
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
- Offrir un clone local et privé du dépôt « insights-lm-local-package » avec parité fonctionnelle stricte, en remplaçant uniquement n8n par une API locale exposant les mêmes webhooks (aucun autre changement de design, d’UX, de flux, ou de fonctionnalités).
- Fidélité: reprendre le comportement de la version originale au plus près (modèles, flux d’ingestion/indexation, RAG, transcription et TTS, intégrations Supabase/Ollama), hors la substitution technique de n8n.
- Exécution locale et offline-first, conformément aux guides et capacités du dépôt d’origine (modèles téléchargés localement).
- Base de données: DOIT être locale et en PostgreSQL (avec pgvector). Si Supabase est utilisé, il l’est uniquement en mode local, reposant sur PostgreSQL local. Aucun service cloud n’est autorisé pour la base.

Gouvernance & Méthodologie (résumé)
- Task‑Master OS: « Pas de tâche, pas de travail ». Toute action est liée à un ID de `.taskmaster/tasks.json` (SPEC → IMPL → TEST → AUDIT).
- Binôme Implémenteur/Auditeur: production vs. conformité/parité; l’auditeur arbitre la parité avec la version originale.
- Revue de parité hebdomadaire: comparaison bouts‑à‑bouts avec les repos `docs/clone/`, décisions documentées dans `docs/DECISIONS.md`.
- Séparation FE/BE stricte: interfaces contractuelles stables, FE autorisé à utiliser des mocks contractuels tant que BE n’est pas prêt.

Référence continue au repo modèle
- Source de vérité: dépôts clonés sous `docs/clone/` (frontend et package local original). Toute implémentation doit citer la section/fichier d’origine correspondant et démontrer l’équivalence (payloads, endpoints, schémas, comportements).
- Répertoires:
  - `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main`
  - `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Aucune divergence non validée: tout écart doit être explicitement approuvé et documenté comme « adaptation validée » avec lien vers le fichier modèle et justification.

<a id="sec-2-objectifs"></a>
## 2. Objectifs & Critères de succès (V1)
- Parité stricte: correspondance 1:1 des fonctionnalités du repo d’origine (hors n8n) — mêmes UX, endpoints (via Edge Functions), formats d’échange et comportements attendus.
- Fonctionnel complet conforme à l’original: ingestion, indexation vectorielle, chat RAG avec citations, génération audio (TTS) et transcription audio (ASR) locales.
- Offline: après téléchargement initial des modèles, fonctionnement hors ligne conformément à l’original.
- Succès V1: « parité totale avec la version originale (sans n8n) », sans ajout de fonctionnalités non présentes.

<a id="sec-3-personas"></a>
## 3. Personas & Cas d’usage
- S’aligner sur les cas d’usage exposés par la version originale (assistant de recherche local):
  - Chat contextuel avec documents (RAG) et citations vérifiables.
  - Import et indexation de sources (PDF/texte/sites/audio) identiques au périmètre d’origine.
  - Génération audio locale et transcription audio locale, comme dans le package original.

<a id="sec-4-portee"></a>
## 4. Portée (Scope)
- Inclus (V1 — parité avec l’original):
  - Ingestion de sources: PDF, texte, sites web, audio (conformément aux workflows et Edge Functions originaux).
  - Indexation: chunking/metadata et embeddings via Ollama (ex. `nomic-embed-text`), structure `documents` et RPC `match_documents` identiques.
  - Chat RAG: citations et mapping vers les sources/chunks identiques.
  - Audio: transcription (Whisper ASR) et génération TTS (Coqui) locales comme dans l’original.
  - Remplacement strict de n8n par une API locale exposant les mêmes webhooks attendus par les Edge Functions (pas d’autres changements).
- Exclus: tout ajout non présent dans la version originale.

<a id="sec-5-contraintes"></a>
## 5. Contraintes & Hypothèses
- Environnements & exécution: suivre les mêmes profils que l’original (services Docker locaux; GPU/CPU selon configuration indiquée par les images/README amont). Pas d’exigence supplémentaire.
- Modèles LLM/Embeddings: reprendre les choix/configurations de l’original (ex.: LLM `qwen3:8b-q4_K_M` tel que documenté, embeddings `nomic-embed-text`), sans substitution non nécessaire.
- Stockage des modèles: même convention que l’original (volumes/config Docker tels que fournis). Pas d’options additionnelles si non présentes.
- Offline: identique à l’original (téléchargement initial, puis fonctionnement local).
- Licence: alignée avec le dépôt d’origine.
- Gouvernance: application systématique du flux SPEC → IMPL → TEST → AUDIT sous Task‑Master; aucune contribution sans tâche ouverte.

<a id="sec-6-donnees"></a>
## 6. Données & Schéma
- Base et schéma: reprendre intégralement le SQL fourni par le package original (tables, RLS, RPC) dans une instance PostgreSQL locale (pgvector), sans altération.
- Historique chat: conserver `n8n_chat_histories` et formats des messages identiques (ajout/lecture conformes aux Edge Functions/clients d’origine).
- Stockage: buckets et politiques identiques à la migration fournie.
- Parité DB: tout changement de schéma est interdit hors alignement 1:1 avec le modèle; toute adaptation requiert une entrée `DECISIONS.md` liée à une tâche.

<a id="sec-7-api"></a>
## 7. API & Intégrations
- Remplacement n8n: par une API locale (orchestrateur) qui expose exactement les webhooks attendus par les Edge Functions existantes, via les variables d’environnement d’origine:
  - `NOTEBOOK_CHAT_URL`
  - `DOCUMENT_PROCESSING_WEBHOOK_URL`
  - `ADDITIONAL_SOURCES_WEBHOOK_URL`
  - `NOTEBOOK_GENERATION_URL`
  - `AUDIO_GENERATION_WEBHOOK_URL`
- Contrats I/O: respecter les payloads/réponses tels qu’envoyés/consommés par les Edge Functions et workflows d’origine (statuts HTTP compris, ex. 202 pour génération notebook).
- Variables d’environnement: réutiliser strictement les noms/semantiques fournis, en les pointant vers l’orchestrateur.
- Observabilité: logs par étape selon le niveau déjà prévu par les composants d’origine (sans ajout de protocole spécifique).
- Parité continue: chaque endpoint est validé hebdomadairement contre l’original (payload/headers/status/side‑effects DB). Évidences jointes au rapport de parité.

Discipline de conformité
- Lors de l’implémentation, chaque route et structure I/O doit être vérifiée contre les Edge Functions et workflows du repo modèle (voir `WEBHOOKS_MAPPING.md`, `ANNEXES_PAYLOADS.md`). Les PR doivent inclure des références précises vers les fichiers d’origine.

<a id="sec-8-fonctionnel"></a>
## 8. Exigences Fonctionnelles (détail)
- Ingestion/Indexation: reproduire les étapes et métadonnées telles que dans les workflows n8n originaux (extraction, chunking, embeddings via Ollama, upsert dans `documents` avec `metadata.notebook_id`, `source_id`, `loc.lines.from/to`).
- Chat RAG: même séquencement que l’original (embedding de requête, RPC `match_documents`, génération LLM, citations, écriture dans `n8n_chat_histories`).
- Audio: prise en charge de la génération TTS et de la transcription ASR locales dans les mêmes conditions que l’original (déclenchement via webhooks correspondants et callbacks).
- Paramètres modèles: reprendre les valeurs/documentations du dépôt d’origine (ex. LLM `qwen3:8b-q4_K_M`, embeddings dimension 768), sans ajout de paramètres non présents.
- Gouvernance: chaque exigence fonctionnelle est couverte par au moins 4 sous‑tâches Task‑Master (SPEC/IMPL/TEST/AUDIT) et une vérification de parité programmée.

<a id="sec-9-non-fonctionnel"></a>
## 9. Exigences Non Fonctionnelles
- Performance: aucune cible nouvelle n’est introduite — se conformer au comportement et aux capacités de l’original (GPU/CPU selon configuration explicite des services).
- Robustesse: gestion des erreurs par étape conformément à l’original (ingestion, embeddings, upsert, retrieval, génération).
- Sécurité: même modèle que l’original (contexte local, header Authorization tel qu’utilisé par les Edge Functions).
- Localité des données: identique à l’original (exécution locale; offline après installation des modèles).
- Journalisation: logs alignés sur les composants existants; pas d’ajout de mécanismes propriétaires.

<a id="sec-10-plateformes"></a>
## 10. Plateformes & Dépendances
- Plateforme et services: reprendre ceux de l’original (PostgreSQL local avec pgvector; Supabase en option locale pour Auth/Realtime/Storage), Ollama, nœuds audio/transcription locaux, via Docker.
- Modèles (stockage): suivre strictement les volumes et conventions fournis par le package original.

<a id="sec-11-deploiement"></a>
## 11. Déploiement & Installation
- Suivre la documentation d’installation du package original. Seule différence: les `*_WEBHOOK_URL` pointent vers l’API locale (orchestrateur) au lieu de n8n.
- Conserver les mêmes profils Docker, volumes et variables d’environnement (ajustées uniquement pour rediriger les webhooks). La base de données est une instance PostgreSQL locale (pgvector) — aucun recours à une base distante.

Rituels de parité
- Revue hebdomadaire: exécuter un scénario de bout en bout sur l’original et le clone; comparer réponses, statuts, mutations DB et UX.
- Consigner dans `docs/PARITY_REVIEW_CHECKLIST.md` et créer/mettre à jour une entrée `docs/DECISIONS.md` si des écarts sont acceptés (avec ID de tâche).

Variante — Modèles Ollama sur D:/modeles_llm (Windows)
- Autoriser le partage du disque D: dans Docker Desktop (Settings → Resources → File Sharing).
- Dans le service `ollama` du `docker-compose.yml` (infra de base), monter le dossier local et définir la variable d’environnement:
  - volumes: `- "D:/modeles_llm:/root/.ollama"`
  - environment: `- OLLAMA_MODELS=/root/.ollama`
- Démarrer le service Ollama puis vérifier: `docker exec -it <container_ollama> ollama list`.
- Remarque: `D:/modeles_llm` doit contenir un store Ollama valide (manifest + blobs). Si nécessaire, exécuter `ollama pull <model>` avec le montage actif pour initialiser le store.

<a id="sec-12-tests"></a>
## 12. Tests & Acceptation
- Jeux d’essai: identiques en esprit à ceux utilisés par l’original (PDF/texte/web/audio) pour vérifier ingestion/indexation, chat (citations), audio et transcription.
- Critères d’acceptation V1:
  - Parité des fonctionnalités du dépôt original (y compris audio et transcription locales).
  - Citations précises et vérifiables (mapping source/lines).
  - Fonctionnement local/offline après installation initiale.

<a id="sec-13-roadmap"></a>
## 13. Roadmap
- V1: Parité complète avec l’original (sans n8n), incluant ingestion/indexation, chat RAG + citations, audio (TTS) et transcription (ASR) locales.
- Post‑parité: aucun ajout prévu dans ce document (l’objectif est la fidélité). Toute évolution au‑delà de l’original serait traitée séparément.

<a id="sec-14-risques"></a>
## 14. Risques & Atténuations
- Risques d’écarts fonctionnels si les webhooks ne respectent pas strictement les contrats d’origine (mitigation: calquer les payloads/réponses sur les Edge Functions et workflows fournis).
- Dépendances modèles/ressources locales (mitigation: suivre la procédure amont et versions d’images/volumes du package original).
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
S’aligner sur la structure et l’ordre des capacités du package original. Aucune roadmap additionnelle ni jalons internes ne sont introduits dans ce document.

<a id="sec-17-raci"></a>
## 17. Gouvernance et Rôles (Modèle Implémenteur/Auditeur)

La gouvernance du projet est entièrement pilotée par l'outil `task-master` et repose sur un modèle de responsabilités en duo, conçu pour maximiser la qualité et la parité avec le projet original.

### Le Duo Implémenteur/Auditeur

Chaque fonctionnalité ou "Epic" est prise en charge par un duo d'IA avec des rôles distincts et complémentaires :

- **IA "Implémenteur"**
  - **Responsabilités :**
    - Réaliser les tâches de type `IMPL` et `TEST`.
    - Écrire le code de la fonctionnalité conformément aux spécifications (`SPEC`).
    - Créer les tests unitaires, d'intégration et de parité nécessaires pour valider le code.
    - Mettre à jour le statut des tâches dans `task-master` (`in-progress` -> `review`).
  - **Objectif :** Produire un code fonctionnel, testé et robuste.

- **IA "Auditeur"**
  - **Responsabilités :**
    - Réaliser les tâches de type `SPEC` et `AUDIT`.
    - Rétro-ingénierer le projet original pour définir les contrats d'API et les comportements attendus dans les tâches de spécification.
    - Valider que l'implémentation est strictement conforme aux spécifications et à la parité.
    - Mener les revues de code, de sécurité et de performance.
    - Avoir la responsabilité finale de passer une tâche à l'état `done`.
  - **Objectif :** Garantir la conformité, la qualité et la parité du projet.

### Flux de Travail

Ce modèle s'intègre directement dans le flux `SPEC -> IMPL -> TEST -> AUDIT` géré par `task-master`. Une tâche ne peut avancer à l'étape suivante sans la validation de l'étape précédente, assurant ainsi que chaque aspect est spécifié avant d'être codé, et audité avant d'être considéré comme terminé.

<a id="sec-18-plan-tests"></a>
## 18. Plan de tests — Référence
S’appuyer sur les documents de tests du dépôt (CHECKLIST_TESTS_V1.md, TEST_REPORT_V1.md) et sur les Edge Functions originales pour définir les cas. Ne pas introduire de cibles chiffrées ni de politiques nouvelles ici.

## 19. Références croisées
- Checklist d’exécution des tests V1: `CHECKLIST_TESTS_V1.md`
- Modèle de rapport de tests V1: `TEST_REPORT_V1.md`
- Mapping webhooks: `WEBHOOKS_MAPPING.md`

## 20. Contrats d’API — Référence
Les contrats d’API découlent des Edge Functions du package original et des variables d’environnement (`*_WEBHOOK_URL`). Utiliser `DOCUMENTATION_PROJET.md` et `WEBHOOKS_MAPPING.md` comme références. Aucune sémantique additionnelle (idempotence, en‑têtes custom, modèles d’erreurs) n’est imposée dans ce document au‑delà de ce qui est observé dans l’original.

## Références Claims & Audits

- Voir `docs/DOCUMENTATION_PROJET.md` — section "Claims & Audits (processus et conventions)".
- Répertoires: `claims/` (demandes) et `audit/` (vérifications).
- Templates:
  - Claim: `claims/TEMPLATE_CLAIM.md`
  - Audit: `audit/TEMPLATE_AUDIT.md`
- Nommage (résumé):
  - Claims: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-claim[_resubmit-<n>]_v<maj.min>.md`
  - Audits: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-audit_v<maj.min>.md`
- Front‑matter YAML requis: `title, doc_kind, team, team_name, tm_ids, scope, status, version, author, related_files`.
- Exigences de conformité:
  - Inclure au moins une ligne `#TEST:` pointant vers des preuves (tests, logs, artefacts)
  - Inclure la section `## Limitations` dans chaque document

### Validation automatique (rappel)
- `node scripts/validate-claims-audit.mjs` — échoue si nommage/front‑matter/#TEST/Limitations non conformes.

#TEST: docs/spec/README.md
