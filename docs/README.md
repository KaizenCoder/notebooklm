# Documentation Projet NotebookLM

Cette documentation couvre tous les aspects du projet NotebookLM, de la conception technique aux validations qualité.

## Alerte MANDATORY — Communication inter‑agents
Tous les échanges inter‑agents (orchestrateur, implémenteur, auditeur, etc.) DOIVENT passer par Redis Streams multi‑flux:
- Canaux: `agents:global`, `agents:orchestrator`, `agents:pair:<team>`
- Heartbeats: `AGENT_ONLINE` au boot puis `*_ALIVE` toutes les 600 s (± 30 s) sur pair + global
- Claims/Audits: publication préalable sur `agents:pair:<team>` (`STATUS_UPDATE`, `AUDIT_REQUEST`, `AUDIT_VERDICT`)
- Références: `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md`, `docs/communication/CLAIMS_AUDITS_REDIS_POLICY.md`

## Structure de la Documentation

### 📋 Spécifications (`/spec/`)
- Spécifications techniques OpenAPI
- Formats de logs et modèles d'erreurs
- Spécifications des adaptateurs et services

### 🔍 Validation (`/validation/`)
- Rapports de validation technique
- Contrôles qualité automatisés et manuels
- Validation des hooks Git et CI/CD

### 🤝 Coordination (`/coordination/`)
- Documents de coordination inter-équipes
- Rapports de finalisation des tâches majeures
- Synchronisation Task-Master

### 📞 Communication (`/communication/`)
- Référence bus Redis Streams multi‑flux (OBLIGATOIRE)
- Templates et guidelines de communication

### 🧩 Clone (`/clone/`)
- Documentation du système original à cloner
- Références et patterns d'implémentation

### 📝 Prompts (`/prompts/`)
- Prompts et templates pour l'IA
- Guidelines d'interaction

## Documents Principaux

### Gouvernance et Processus
- `GOUVERNANCE.md` - Framework gouvernance projet (inclut la politique Redis Streams obligatoire)
- `TECHNICAL_GUIDELINES.md` - Guidelines techniques
- `DECISIONS.md` - Log des décisions architecturales

### Planning et Roadmap
- `PRD.md` - Product Requirements Document
- `FRONTEND_PRD.md` - Spécifications frontend
- `ORCHESTRATOR_IMPLEMENTATION_PLAN.md` - Plan d'implémentation

### Qualité et Tests
- `TEST_REPORT_V1.md` - Rapports de tests
- `CHECKLIST_TESTS_V1.md` - Checklists de validation (section 0: communication Redis obligatoire)
- `PARITY_REVIEW_CHECKLIST.md` - Vérification parité

## Liens avec Autres Dossiers

### `/audit/` - Audits Formels
Audits techniques des implémentations Task-Master avec validation contractuelle.

### `/claims/` - Demandes de Validation  
Claims pour validation des tâches et features implémentées.

### `/.taskmaster/` - Gouvernance Tâches
Configuration et tracking des tâches avec statuts et dépendances.

## Conventions

### Nomenclature Fichiers
- `[TYPE]_[DESCRIPTION]_[VERSION].md` pour les documents versionnés
- `[topic]-[action]-[YYYYMMDD].md` pour les documents datés
- `README.md` dans chaque dossier pour l'explication

### Statuts Documents
- **draft** - Brouillon en cours de rédaction
- **review** - En cours de révision
- **approved** - Validé et approuvé  
- **final** - Version finale et stable

### Métadonnées
Les documents techniques incluent des métadonnées YAML frontmatter :
```yaml
---
title: "Titre du document"
doc_kind: spec|audit|claim|coordination
team: team-XX
version: X.Y
status: draft|review|approved|final
author: [nom]
---
```

## Utilisation

1. **Développeurs** → `/spec/` pour APIs et contrats
2. **QA/Test** → `/validation/` pour contrôles qualité
3. **Project Managers** → `/coordination/` pour avancement
4. **Auditeurs** → `/audit/` et `/claims/` + bus Redis (références ci‑dessus)

---

*Documentation maintenue par les équipes foundations, rag-audio et ingestion*