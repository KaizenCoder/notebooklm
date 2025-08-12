# 📡 GUIDE OPÉRATIONNEL DE COMMUNICATION REDIS STREAMS

**Version:** 1.0  
**Date:** 2025-07-23  
**Statut:** **ACTIF - PROTOCOLE DE COMMUNICATION OBLIGATOIRE**

---

## 1. 🎯 PRINCIPE DIRECTEUR

Ce guide simplifie la communication inter-équipes. Il définit des canaux clairs basés sur l'**intention** de la communication. Le respect de cette nomenclature est **obligatoire** pour assurer une coordination fluide.

---

## 2. 📢 CANAUX DE COORDINATION GLOBALE

Ces canaux sont utilisés pour la visibilité et les situations urgentes. **Toutes les équipes** doivent écouter ces streams.

### 2.1. `coordination_heartbeat`

-   **Objectif :** Signaler son état et l'action en cours.
-   **Qui Publie ?** Toutes les équipes (Magenta, Violet, Orange, Auditeur, GAIA).
-   **Qui Écoute ?** Toutes les équipes.
-   **Quand Publier ?**
    -   Au début d'une session de travail.
    -   Au début d'une nouvelle tâche (`task-master set-status <ID> in-progress`).
    -   À la fin d'une tâche (`task-master set-status <ID> done`).

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD coordination_heartbeat "*" \
      from_agent "magenta_specialist" \
      event "TASK_START" \
      task_id "18" \
      details "Starting work on [PHASE 2][MAGENTA] Architecture TaskPlanner Base"
    ```

### 2.2. `emergency_escalation`

-   **Objectif :** Signaler un bloqueur critique qui empêche **tout** progrès.
-   **Qui Publie ?** N'importe quelle équipe rencontrant un bloqueur majeur.
-   **Qui Écoute ?** Toutes les équipes, avec une attention particulière pour GAIA et l'Auditeur.
-   **Quand Publier ?** Uniquement en cas de problème majeur (ex: "Redis ne répond plus", "Impossible de commiter sur Git").

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD emergency_escalation "*" \
      from_agent "violet_specialist" \
      severity "CRITICAL" \
      issue "Redis container is not responding. All teams blocked."
    ```

---

## 3. 📨 CANAUX DE DEMANDES INTER-ÉQUIPES

Ces canaux sont utilisés pour demander une action spécifique à une autre équipe. Le nom du canal indique clairement le destinataire.

### 3.1. `requests_for_orange`

-   **Objectif :** Demander à l'équipe Orange de tester, valider ou créer des benchmarks pour un composant.
-   **Qui Publie ?** Magenta, Violet.
-   **Qui Écoute ?** Orange.

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD requests_for_orange "*" \
      from_agent "magenta_specialist" \
      request_type "INTEGRATION_TEST" \
      task_id "18" \
      details "The base architecture for TaskPlanner is ready for integration testing."
    ```

### 3.2. `requests_for_violet`

-   **Objectif :** Demander à l'équipe Violet une action sur l'infrastructure (ex: nouvelle configuration Redis, problème de base de données).
-   **Qui Publie ?** Magenta, Orange, GAIA.
-   **Qui Écoute ?** Violet.

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD requests_for_violet "*" \
      from_agent "orange_specialist" \
      request_type "INFRA_ISSUE" \
      details "ChromaDB container seems slow. Please investigate performance."
    ```

### 3.3. `requests_for_magenta`

-   **Objectif :** Demander à l'équipe Magenta une modification ou une clarification sur le core system (TaskPlanner, LLM, etc.).
-   **Qui Publie ?** Violet, Orange, GAIA.
-   **Qui Écoute ?** Magenta.

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD requests_for_magenta "*" \
      from_agent "gaia_coordinator" \
      request_type "FEATURE_CLARIFICATION" \
      task_id "19" \
      details "Need clarification on the expected output of the decomposition logic for parallel tasks."
    ```

---

## 4. 🔒 CANAUX D'AUDIT

Ces canaux formalisent le processus de validation par l'Auditeur.

### 4.1. `audit_requests`

-   **Objectif :** Soumettre une tâche terminée à l'Auditeur pour validation finale.
-   **Qui Publie ?** Magenta, Violet, Orange, GAIA.
-   **Qui Écoute ?** Auditeur.
-   **Quand Publier ?** Lorsqu'une tâche est considérée comme terminée par l'équipe de développement.

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD audit_requests "*" \
      from_agent "magenta_specialist" \
      task_id "18" \
      details "Task [PHASE 2][MAGENTA] Architecture TaskPlanner Base is complete and ready for audit."
    ```

### 4.2. `auditeur_compliance`

-   **Objectif :** Publier le verdict officiel de l'Auditeur sur une tâche.
-   **Qui Publie ?** Auditeur.
-   **Qui Écoute ?** Toutes les équipes.

-   **Exemple de Publication :**
    ```bash
    docker exec nextgen_redis_mcp redis-cli XADD auditeur_compliance "*" \
      from_agent "claude_auditeur" \
      task_id "18" \
      status "APPROVED" \
      details "The implementation is compliant with the architecture and security standards."
    ```

```