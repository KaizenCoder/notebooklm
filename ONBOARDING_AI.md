# Guide d'Onboarding pour les IA

Bienvenue dans le projet de clonage de **InsightsLM Local**. Ce guide vous expliquera tout ce que vous devez savoir pour devenir rapidement un membre productif de l'équipe.

## Mission Principale

Notre objectif est de créer un clone avec **parité stricte** de l'application originale en remplaçant le composant `n8n` par une API Orchestrator sur mesure. La règle d'or est la fidélité au projet original : nous ne réinventons rien, nous remplaçons et nous répliquons.

## Philosophie du Projet : "Task-Master OS"

Ce projet est entièrement piloté par l’outil `task-master`. Notre devise est : **"Pas de tâche, pas de travail."**

Toute action, de la spécification à la validation, est une tâche tracée. `task-master` n’est pas un outil de suivi, il **est** le plan, le processus et la source de vérité sur l’avancement du projet.

---

## Étape 1 : Phase de Lecture (Obligatoire)

Avant toute chose, vous devez lire et comprendre les documents de cadrage suivants. Ils ne sont pas optionnels.

1.  **`DEVELOPMENT_PLAN.md`** : Stratégie d'exécution, grandes phases, ordre de développement.
2.  **`docs/PRD.md`** : Vision produit, exigences, gouvernance Implémenteur/Auditeur.
3.  **`docs/GOUVERNANCE.md`** : Règles du binôme, Task‑Master OS, revues de parité.
4.  **`docs/TECHNICAL_GUIDELINES.md`** : Règles techniques impératives (GPU‑only, idempotence, timeouts, santé).
5.  **`docs/spec/openapi.yaml`** et `docs/spec/README.md` : Source de vérité des contrats d’API.
6.  **`docs/PARITY_REVIEW_CHECKLIST.md`** et **`docs/DECISIONS.md`** : Rituel de parité et journal des décisions.
7.  **Communication inter‑agents (Obligatoire)** : Lire `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md`.

## Étape 2 : Configuration de l'Environnement

Notre environnement est entièrement conteneurisé pour garantir l'uniformité.

1.  **Clonez le dépôt** sur votre environnement local.
2.  **Copiez le fichier d'environnement** : `cp .env.example .env`.
3.  **Lancez Docker Compose** (`infra/docker-compose.yml`).
4.  **Installez les dépendances** locales.
5.  **Variables d’environnement minimales (exemple)** :
    - `POSTGRES_DSN=postgres://notebook:notebook@localhost:5432/notebook`
    - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
    - `NOTEBOOK_GENERATION_AUTH=changeme`

## Étape 3 : Votre Rôle et Votre Première Tâche

Ce projet fonctionne avec des **duos d'IA : un Implémenteur et un Auditeur.**

-   **L'Implémenteur** code et teste (`IMPL`, `TEST`).
-   **L'Auditeur** spécifie et valide la parité (`SPEC`, `AUDIT`).

Premières actions :

1.  `task-master list --with-subtasks`
2.  Identifiez votre rôle et vos tâches.
3.  Comprenez le flux : SPEC → IMPL/TEST → AUDIT.

## Étape 4 : Cycle de Travail Quotidien

1.  `git pull`
2.  `task-master next`
3.  `task-master set-status --id <ID> --status in-progress`
4.  `git checkout -b feature/TM-<ID>-...`
5.  Implémentez + tests
6.  `git commit -m "TM-<ID>: ..."`
7.  PR + `task-master set-status --id <ID> --status review`

## Règles d'Or

- **Parité** : le comportement dans `docs/clone/` fait foi.
- **Task‑Master** : pas de code sans tâche.
- **Documentation** : specs/guides techniques = exigences.

---

## Pré‑requis Techniques & ENV
- PostgreSQL (pgvector), Ollama GPU‑only.
- ENVs clés: `POSTGRES_DSN`, `OLLAMA_BASE_URL`, `NOTEBOOK_GENERATION_AUTH`.
- En‑têtes API: `Authorization: ${NOTEBOOK_GENERATION_AUTH}`.

## Vérifications Santé & GPU
- `GET /health`, `GET /ready` (503 si non prêt).
- GPU‑only (pas de fallback CPU).

## Sécurité & Réseau
- Orchestrateur non exposé publiquement.
- Logs JSON avec `correlation_id`.

## Parité Hebdomadaire
- Check‑list `docs/PARITY_REVIEW_CHECKLIST.md`.
- `docs/DECISIONS.md` pour toute décision.

## Frontend & Mocks
- Mocks contractuels tant que webhooks non prêts.

## Modèle d’Erreur & Idempotence
- Réponse standard `{ code, message, details?, correlation_id }`.
- Idempotence via `Idempotency-Key`.

## Communication Inter‑Agents (Obligatoire)

Tous les agents (orchestrateur, implémenteur, auditeur, etc.) **DOIVENT** utiliser Redis Streams.

## Communication Redis (OBLIGATOIRE)

### Activation Explicite des Événements
L'orchestrator et tous les agents DOIVENT implémenter les événements suivants :

#### 1. Événements de Cycle de Vie
- **AGENT_ONLINE** : au démarrage de l'application (boot Fastify)
- **AGENT_ALIVE** : périodiquement toutes les 600s ± 30s (heartbeat de maintenance)
- **AGENT_OFFLINE** : à l'arrêt propre de l'application (hook onClose)

#### 2. Événements de Workflow
- **STATUS_UPDATE** : avant publication d'une claim dans `claims/`
- **AUDIT_REQUEST** : demande d'audit (impl → auditor)
- **AUDIT_VERDICT** : verdict d'audit (auditor → impl)

### Scripts de Communication
Utiliser le script unifié pour les heartbeats :
```bash
# Mode boot (démarrage)
node scripts/agent-heartbeat.mjs --mode boot --agent orchestrator --team orange --role impl

# Mode loop (maintenance périodique)
node scripts/agent-heartbeat.mjs --mode loop --redis redis://127.0.0.1:6379 --streams agents:pair:team03,agents:global --agent orchestrator --team orange --role impl --interval_ms 600000 --jitter_ms 30000

# Mode shutdown (arrêt propre)
node scripts/agent-heartbeat.mjs --mode shutdown --agent orchestrator --team orange --role impl
```

### Mapping des Streams
- **`agents:global`** : messages globaux (heartbeats, status critiques)
- **`agents:orchestrator`** : inbox spécifique orchestrator
- **`agents:pair:<team>`** : communication duo impl/audit (ex: `agents:pair:team03`)
- **`audit_requests`** : demandes d'audit (legacy, utiliser agents:pair prioritairement)
- **`auditeur_compliance`** : verdicts d'audit (legacy, utiliser agents:pair prioritairement)
- **~~`coordination_heartbeat`~~** : **DÉPRÉCIÉ** - utiliser exclusivement `agents:*`

### Intégration Application
Dans l'orchestrator Fastify :
```typescript
// Au démarrage (app.ts)
app.ready(async () => {
  if (comms) {
    await comms.publishHeartbeat({
      from_agent: 'orchestrator',
      team: 'orange', 
      role: 'impl',
      event: 'AGENT_ONLINE',
      // ... autres champs obligatoires
    });
  }
});

// À l'arrêt (hook onClose)
app.addHook('onClose', async () => {
  if (comms) {
    await comms.publishHeartbeat({
      event: 'AGENT_OFFLINE',
      // ... autres champs
    });
  }
});

// Job périodique pour AGENT_ALIVE (si REDIS_URL présent)
if (env.REDIS_URL && comms) {
  setInterval(async () => {
    await comms.publishHeartbeat({
      event: 'ORCHESTRATOR_ALIVE',
      // ... autres champs
    });
  }, 600000 + Math.random() * 60000); // 600s ± 30s
}
```

- **Canaux**: `agents:global`, `agents:orchestrator`, `agents:pair:<team>`.
- **Heartbeats (obligatoire)**:
  - Boot: `AGENT_ONLINE` sur pair + global
  - Périodique: toutes les 600 s (± 30 s) `*_ALIVE`
  - Shutdown: `AGENT_OFFLINE`
- **Obligations de publication**:
  - Avant un Claim (`claims/`): publier `STATUS_UPDATE` sur `agents:pair:<team>` avec lien de preuve/PR
  - Avant un Audit (`audit/`): publier `AUDIT_REQUEST` (impl → audit) puis `AUDIT_VERDICT` (audit → impl)
- **Script recommandé**: `orchestrator/scripts/agent-heartbeat.mjs` (modes boot/loop/shutdown). Exemple:
  ```bash
  node scripts/agent-heartbeat.mjs --mode loop --redis redis://127.0.0.1:6379 --streams agents:pair:team03,agents:global --agent auditor_team03 --team team03 --role audit --to orchestrator --pair team03 --interval_ms 600000 --jitter_ms 30000
  ```
- **Dépréciation**: `coordination_heartbeat` → utiliser exclusivement `agents:*`.

Consultez la référence détaillée: `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md`.
