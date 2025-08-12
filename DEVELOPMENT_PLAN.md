# Plan de Développement Dynamique

## 1. Philosophie

Ce document n'est pas un calendrier ou un diagramme de Gantt statique. Le plan de développement détaillé et la source de vérité pour le suivi de l'avancement résident dans le fichier `.taskmaster/tasks.json`.

Ce document décrit la **stratégie d'exécution** pour aborder les tâches et les Épics définis dans `task-master`, en s'appuyant sur nos documents de cadrage :

- **Le "Pourquoi"** : `docs/PRD.md`
- **Les "Règles Techniques"** : `docs/TECHNICAL_GUIDELINES.md`
- **Les "Contrats d'API"** : `docs/spec/*.yaml`
- **Le "Plan d'Action"** : `.taskmaster/tasks.json`

## 2. Le Cycle de Vie d'une Tâche (Rappel)

Chaque Épic listé ci-dessous sera exécuté en suivant le flux de travail `SPEC -> IMPL -> TEST -> AUDIT` piloté par le duo Implémenteur/Auditeur, comme défini dans le `PRD.md`.

## 3. Ordre d'Exécution Stratégique des Épics

L'ordre des phases est dicté par les dépendances logiques définies dans `task-master`. L'objectif est de construire l'application sur des fondations solides, de livrer la valeur métier principale, puis d'ajouter les fonctionnalités périphériques et la robustesse.

### Phase 1 : Les Fondations de l'API

- **Objectif :** Mettre en place le squelette de l'API, les services transverses et les adaptateurs pour les dépendances externes. À la fin de cette phase, l'API démarre, est sécurisée, mais n'a pas encore de logique métier complexe.
- **Épics `task-master` concernés :**
  - **Tâche 7 :** `Auth middleware`
  - **Tâche 8 :** `Service adapters (Supabase/Ollama/...)`
  - **Tâche 14 :** `Health & readiness checks`
  - **Tâche 18 :** `GPU-only enforcement`

### Phase 2 : Le Cœur Métier (Ingestion & RAG)

- **Objectif :** Implémenter les deux fonctionnalités les plus critiques de l'application : l'indexation d'un document et la conversation avec ce document.
- **Dépendances `task-master` :** Tâche 8 (Service adapters).
- **Épics `task-master` concernés :**
  - **Tâche 9 :** `Chunking + embeddings`
  - **Tâche 2 :** `POST /webhook/process-document`
    - **Référence Contrat :** La sous-tâche `SPEC-2.4` doit être strictement alignée avec `docs/spec/process-document.yaml`.
  - **Tâche 1 :** `POST /webhook/chat`
    - **Référence Contrat :** La sous-tâche `SPEC-1.4` doit être strictement alignée avec `docs/spec/chat.yaml`.

### Phase 3 : Complétion du Périmètre Fonctionnel

- **Objectif :** Implémenter les autres endpoints pour atteindre la parité fonctionnelle complète avec le projet original.
- **Dépendances `task-master` :** Tâche 2 (process-document).
- **Épics `task-master` concernés :**
  - **Tâche 3 :** `POST /webhook/process-additional-sources (multiple-websites)`
    - **Référence Contrat :** La sous-tâche `SPEC-3.3` doit être alignée avec `docs/spec/process-additional-sources.yaml`.
  - **Tâche 4 :** `POST /webhook/process-additional-sources (copied-text)`
    - **Référence Contrat :** La sous-tâche `SPEC-4.3` doit être alignée avec `docs/spec/process-additional-sources.yaml`.
  - **Tâche 5 :** `POST /webhook/generate-notebook-content`
    - **Référence Contrat :** La sous-tâche `SPEC-5.3` doit être alignée avec `docs/spec/generate-notebook-content.yaml`.
  - **Tâche 6 :** `POST /webhook/generate-audio`
    - **Référence Contrat :** La sous-tâche `SPEC-6.3` doit être alignée avec `docs/spec/generate-audio.yaml`.

### Phase 4 : Robustesse, Performance et Finalisation

- **Objectif :** Transformer l'application fonctionnelle en un service robuste, fiable et maintenable.
- **Dépendances `task-master` :** Dépendent des fonctionnalités implémentées dans les phases précédentes.
- **Épics `task-master` concernés :**
  - **Tâche 10 :** `Logging & errors`
  - **Tâche 15 :** `Idempotency-Key layer`
  - **Tâche 16 :** `PDF extraction bridge (Python)`
  - **Tâche 17 :** `Résilience: timeouts/retries`
  - **Tâche 11 :** `E2E smoke via Edge Functions`
  - **Tâche 12 :** `CI: run contract + integration tests`
  - **Tâche 13 :** `Docs sync check`

## 4. Exécution

Le Tech Lead ou le chef de projet assigne les Épics aux duos Implémenteur/Auditeur. L'avancement est suivi en mettant à jour le statut des tâches dans `task-master`. Les revues de parité hebdomadaires permettent de s'assurer que l'implémentation reste fidèle à la vision du `PRD.md` et au comportement du projet original.
