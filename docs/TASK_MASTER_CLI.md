# Guide d’utilisation — Task Master CLI

Ce guide explique comment utiliser Task Master CLI pour piloter les phases du projet.

## Prérequis
- Node.js et npm installés.
- Task Master CLI installé globalement.

Installation (optionnel si déjà fait):
```powershell
npm i -g task-master
```

Projet configuré:
- Fichier tâches: `.taskmaster/tasks.json`
- Config CLI: `.taskmaster/config.json` (réduit les warnings). 
 - Règle d’or: « Pas de tâche, pas de travail » — toute action (SPEC/IMPL/TEST/AUDIT) est créée et suivie ici.

## États de tâche supportés
- `pending`, `in-progress`, `review`, `done`, `deferred`, `cancelled`

## Commandes essentielles

Lister les tâches (avec sous-tâches):
```powershell
task-master list --with-subtasks
```

Voir la prochaine tâche (selon les dépendances):
```powershell
task-master next
```

Afficher le détail d’une tâche:
```powershell
task-master show 4
```

Changer l’état d’une tâche ou sous-tâche:
```powershell
task-master set-status --id 4 --status in-progress
# Plusieurs en même temps (séparés par virgule)
task-master set-status --id 4.1,4.2 --status done
```

Ajouter une tâche (par IA) avec priorité et dépendances:
```powershell
task-master add-task --prompt "Implémenter le check embeddings dims=768 au boot" --priority high --dependencies 4
```

Ajouter une sous-tâche à une tâche existante:
```powershell
task-master add-subtask --parent 4 --title "Wiring boot checks" --description "Ollama, Supabase RPC, Storage"
```

Mettre à jour une tâche existante (contexte supplémentaire):
```powershell
task-master update-task --id 4 --prompt "Déplacer /health au M3 et activer logs JSON corrélés"
```

Mettre à jour une sous-tâche:
```powershell
task-master update-subtask --id 4.1 --prompt "Ajouter timeout et retries (x2)"
```

Filtres et export:
```powershell
# Filtrer par statut
task-master list --status pending
# Export vers README (optionnel)
task-master sync-readme --with-subtasks
```

Tags (contextes parallèles de backlog):
```powershell
# Lister les tags
task-master tags
# Créer et passer sur un tag
task-master add-tag sprint-1
task-master use-tag sprint-1
```

## Modèle SPEC → IMPL → TEST → AUDIT
- Créer la SPEC avant toute implémentation:
```powershell
task-master add-subtask --parent 2 --title "SPEC: OpenAPI /webhook/process-document"
```
- L’IMPL dépend de la SPEC; le TEST dépend de la SPEC; l’AUDIT dépend de IMPL+TEST:
```powershell
task-master add-subtask --parent 2 --title "IMPL: Handler process-document" --dependencies 2.1
task-master add-subtask --parent 2 --title "TEST: Contrat HTTP process-document" --dependencies 2.1
task-master add-subtask --parent 2 --title "AUDIT: Parité process-document" --dependencies 2.2,2.3
```

## Parité hebdomadaire & décisions
- Planifier une revue de parité (hebdo):
```powershell
task-master add-task --prompt "REVUE PARITÉ Semaine 34" --priority high
```
- Consigner les décisions dans `docs/DECISIONS.md` avec l’ID de tâche:
```powershell
task-master update-task --id 9 --prompt "DECISION: Aligner top_k=5 (preuve revue)"
```

## Bonnes pratiques
- Mettre à jour l’état au fil de l’eau (`in-progress` → `done`).
- Utiliser des titres courts et des descriptions concrètes.
- Conserver les dépendances réalistes entre phases.
- Committer après une série de changements importants pour historiser le flux.

## Exemples adaptés à ce repo
- Démarrer la Phase 3 (Scaffold API Orchestrator):
```powershell
task-master set-status --id 4 --status in-progress
```
- Clore la sous-tâche 4.1 après init du projet API:
```powershell
task-master set-status --id 4.1 --status done
```

### Gestion des tâches Frontend

Voici des exemples pour gérer les nouvelles phases de développement du frontend :

- Démarrer la Phase 1 du Frontend (Setup & Initial Integration):
```powershell
task-master set-status --id 12 --status in-progress
```
- Marquer la Phase 2 du Frontend comme terminée:
```powershell
task-master set-status --id 13 --status done
```
- Afficher les détails de la Phase 3 du Frontend:
```powershell
task-master show 14
```

## Dépannage
- Warnings de configuration: assurée par `.taskmaster/config.json`. Sinon, préciser `-f .taskmaster/tasks.json`.
- PowerShell quoting: gardez les guillemets doubles autour des prompts contenant des espaces.
- Si une commande échoue, lancez `task-master --help` ou `task-master <cmd> --help`.
