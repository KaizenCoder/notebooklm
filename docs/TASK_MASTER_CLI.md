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

## Dépannage
- Warnings de configuration: assurée par `.taskmaster/config.json`. Sinon, préciser `-f .taskmaster/tasks.json`.
- PowerShell quoting: gardez les guillemets doubles autour des prompts contenant des espaces.
- Si une commande échoue, lancez `task-master --help` ou `task-master <cmd> --help`.
