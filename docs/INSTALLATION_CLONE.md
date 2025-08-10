<!-- Déplacé sous docs/ -->
# Installation — Mode Clone (remplacement n8n, sans implémentation)

Ce guide explique comment cloner et préparer le projet en remplaçant uniquement n8n par un service API local futur (non implémenté). Aucune logique nouvelle n’est ajoutée.

## Prérequis
- Docker Desktop
- Git, Python (ou Node selon vos outils), éditeur de texte
- Supabase local via le repo de base

## Étapes
1) Cloner la base
- `git clone https://github.com/coleam00/local-ai-packaged.git`
- `cd local-ai-packaged`

2) Cloner ce package (insights‑lm local)
- `git clone https://github.com/theaiautomators/insights-lm-local-package.git`

3) Variables d’environnement
- Copier `.env.example` → `.env` (depuis la base `local-ai-packaged`).
- Ouvrir `insights-lm-local-package/.env.copy` et coller toutes ses variables à la fin de votre `.env`.
- Remplacer ces clés pour éviter n8n:
  - `NOTEBOOK_CHAT_URL=http://api:PORT/webhook/chat`
  - `DOCUMENT_PROCESSING_WEBHOOK_URL=http://api:PORT/webhook/process-document`
  - `ADDITIONAL_SOURCES_WEBHOOK_URL=http://api:PORT/webhook/process-additional-sources`
  - `AUDIO_GENERATION_WEBHOOK_URL=http://api:PORT/webhook/generate-audio`
  - Conserver `NOTEBOOK_GENERATION_AUTH`.

4) Docker Compose
- Ouvrir `docker-compose.yml` (racine) et `insights-lm-local-package/docker-compose.copy.yml`.
- Ne pas inclure n8n. Option: déclarer un service `api` placeholder (sans image pour l’instant) ou commenter toute référence à n8n.
- Conserver/co‑décaler les services `ollama`, `whisper-asr`, `coqui-tts` si fournis.

5) Supabase
- Lancer l’infra (DB, Storage, Kong) via la base.
- Importer `insights-lm-local-package/supabase-migration.sql` dans le SQL Editor.
- Copier les dossiers `insights-lm-local-package/supabase-functions/*` vers `supabase/volumes/functions/`.

6) Edge Functions
- Laisser le code tel quel.
- Les URLs `*_WEBHOOK_URL` pointent vers l’API `api` (à implémenter plus tard). Pas d’activation n8n.

7) Démarrage
- Démarrer les conteneurs de l’infra (sans n8n). Le frontend et Supabase fonctionnent, mais les flux dépendants des webhooks seront inactifs tant que l’API Orchestrator n’est pas implémentée.

## Notes
- Ce mode respecte l’existant. Lorsque vous serez prêt, implémentez l’API Orchestrator en suivant la spécification dans `DOCUMENTATION_PROJET.md`.
- Aucun changement de schéma ni de logique frontend n’est requis.

## Convention de montage des modèles (retenue)

Objectif: rester au plus près du repo original. Nous retenons l’usage d’un volume Docker nommé pour les modèles d’Ollama (et à terme Whisper/Coqui), plutôt qu’un chemin Windows direct.

Décision: Option A RETENUE (volume Docker nommé) — Option B reste une alternative de secours sous Windows.

Option A — RECOMMANDÉE (proche de l’original)
- Utiliser un volume nommé monté dans le conteneur Ollama (ex.: `/root/.ollama`).
- Avantages: portable, identique aux pratiques du repo de base, évite les soucis de chemins Windows/WSL.
- Exemple (extrait docker-compose):

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    deploy: {}
    volumes:
      - ollama-models:/root/.ollama
    # ... autres options (runtime GPU, etc.)

volumes:
  ollama-models:
    driver: local
```

Option B — ALTERNATIVE (chemin Windows)
- Monter un dossier Windows, par ex. `D:\\modeles_llm\\`, vers le chemin des modèles dans le conteneur.
- Nécessite l’autorisation de partage de disque dans Docker Desktop; peut rencontrer des problèmes de perfs/compat.
- Exemple (extrait docker-compose):

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - D:\\modeles_llm\\:/root/.ollama
```

Validation
- Vérifier que les modèles se téléchargent/persistent dans le volume choisi (taille du volume croît après premier pull de modèle).
- Confirmer l’accès GPU dans les conteneurs (voir Phase 0 du plan: WSL2 + NVIDIA Container Toolkit). 

## Exemple docker-compose (Option A)

Un exemple minimal est fourni: `docs/docker-compose.example.yml` (infra sans n8n, volume nommé `ollama-models`).

Étapes indicatives (à adapter à votre repo de base):
- Copier ce fichier à la racine de votre projet d’infra (ou fusionner dans votre docker-compose existant).
- Vérifier vos variables d’environnement (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTEBOOK_GENERATION_AUTH`, etc.).
- Démarrer l’infra; contrôler la santé du service `ollama` et la présence du volume `ollama-models`.
