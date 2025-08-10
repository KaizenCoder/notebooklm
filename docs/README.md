# Documentation — NotebookLM Local (clone sans n8n)

## Vue d’ensemble
- But: cloner « insights-lm-local-package » en remplaçant uniquement n8n (pas d’implémentation pour l’instant), cadré par un PRD et des guides.
- Périmètre: parité fonctionnelle avec le repo d’origine hors n8n; Windows + GPU RTX 3090; offline après installation des modèles.

## Fichiers clés
- `PRD.md`: exigences produit complètes (vision, portée, jalons, RACI, plan de tests). Sommaire + ancres inclus.
- `ANALYSE_SANS_N8N.md`: analyse du repo source et mapping n8n → API locale (remplacement conceptuel uniquement).
- `DOCUMENTATION_PROJET.md`: présentation complète (architecture cible, flux, endpoints, ENV, déploiement local).
- `INSTALLATION_CLONE.md`: guide d’installation « mode clone » (remplacer n8n, sans implémentation).
- `CHECKLIST_TESTS_V1.md`: checklist exécutable pour valider la V1 (ingestion/indexation, RAG, citations, perfs, offline).
- `TEST_REPORT_V1.md`: modèle de rapport pour consigner résultats, mesures et preuves.

## Arborescence (résumé)
- `README.md`: liens rapides vers la documentation.
- `docs/`
  - `README.md` (ce fichier)
  - `PRD.md`
  - `ANALYSE_SANS_N8N.md`
  - `DOCUMENTATION_PROJET.md`
  - `INSTALLATION_CLONE.md`
  - `CHECKLIST_TESTS_V1.md`
  - `TEST_REPORT_V1.md`
- `reponse_prd.txt`: réponses utilisées pour générer le PRD.

## Ordre de lecture recommandé
- 1) `PRD.md` (Sommaire → vision/portée → jalons/RACI → plan de tests)
- 2) `DOCUMENTATION_PROJET.md` (détails architecture/flux)
- 3) `ANALYSE_SANS_N8N.md` (référence sur le mapping n8n)
- 4) `INSTALLATION_CLONE.md` (préparation environnement)
- 5) `CHECKLIST_TESTS_V1.md` puis `TEST_REPORT_V1.md` (exécution et rapport)

## Prochaines étapes
- Figurer les cibles de performance (pages/min, latences) dans le PRD.
- Démarrer l’implémentation de l’API locale remplaçant n8n selon `PRD.md`.
