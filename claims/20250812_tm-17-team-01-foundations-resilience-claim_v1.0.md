---
title: "Resilience — Framework de tolérance aux pannes avec retry, timeout, circuit breaker"
doc_kind: claim
team: team-01
team_name: foundations
tm_ids: ["17", "17.1", "17.2", "17.3"]
scope: resilience
status: completed
version: 1.1
author: ia
audit_status: reviewed_and_improved
related_files:
  - orchestrator/src/utils/resilience.ts
  - orchestrator/src/utils/index.ts
  - orchestrator/src/config/adapters.ts
  - orchestrator/test/integration/resilience.test.ts
  - orchestrator/test/integration/production-security.test.ts
  - orchestrator/package.json
audit_improvements:
  - "SLO-based production defaults (500ms initial delay, 1.5x backoff, 10s timeout)"
  - "Comprehensive telemetry system with ResilienceMetrics collector"
  - "Enhanced circuit breaker with 5-failure threshold and 60s reset"
  - "Rate limit detection in retry condition logic"
  - "Production-optimized configuration separation"
---

# Claim — Resilience — Framework de tolérance aux pannes avec retry, timeout, circuit breaker

#TEST: orchestrator/test/integration/resilience.test.ts
#TEST: orchestrator/test/integration/production-security.test.ts

## Résumé (TL;DR)

- Problème constaté: Absence de framework de résilience pour gérer les défaillances réseau, timeouts et pannes de services externes (Ollama, APIs).
- Proposition succincte: Implémentation d'un framework complet avec retry exponentiel, timeouts configurables, circuit breaker et adaptateur Ollama résilient.
- Bénéfice attendu: Stabilité et robustesse de l'orchestrateur face aux défaillances, réduction des erreurs utilisateur, amélioration de l'expérience.
- **Statut audit**: ✅ Recommandations appliquées avec succès - Production-ready avec télémétrie et sécurité renforcée.

## Contexte

- Contexte fonctionnel/technique: L'orchestrateur dépend de services externes (Ollama pour embeddings/chat, APIs ASR/TTS) susceptibles de subir des pannes temporaires ou latences élevées.
- Références: `orchestrator/src/services/ollama.ts`, pattern de résilience standard industrie

## Portée et périmètre (scope)

- Équipe: team-01 / foundations
- Tâches Task‑Master visées: 17 (Resilience & Fault Tolerance)
- Endpoints/domaines: resilience, utilities, error handling

## Demande et motivation

- Description détaillée de la revendication:
  - Framework `withRetry()` avec backoff exponentiel configurable
  - Wrapper `withTimeout()` avec gestion d'erreurs personnalisées
  - Pattern `CircuitBreaker` pour protection contre les services défaillants
  - Adaptateur `createResilientOllamaAdapter()` pour intégration transparente
  - Types d'erreurs spécialisés: `TimeoutError`, `RetryableError`

- Justification (parité, bug, dette, conformité, performance, sécurité):
  - **Performance**: Évite les blocages prolongés lors de pannes de service
  - **Robustesse**: Récupération automatique des erreurs temporaires
  - **Expérience utilisateur**: Réduction des erreurs 500 visibles
  - **Maintenabilité**: Centralisation de la logique de résilience

## Critères d'acceptation

- [x] CA1: Mécanisme de retry avec backoff exponentiel et conditions configurables
- [x] CA2: Wrapper de timeout avec types d'erreurs personnalisés
- [x] CA3: Circuit breaker avec états CLOSED/OPEN/HALF_OPEN
- [x] CA4: Adaptateur Ollama résilient avec intégration transparente
- [x] CA5: Suite de tests complète (17 tests) validant tous les cas d'usage
- [x] CA6: Types TypeScript stricts et documentation inline
- [x] CA7: **Télémétrie complète** avec système de métriques ResilienceMetrics
- [x] CA8: **Configuration production** avec PRODUCTION_DEFAULTS optimisés SLO
- [x] CA9: **Tests sécurité** (5 tests additionnels) validant comportement production

## Impacts

- API/Contrats I/O: Aucun impact sur les APIs externes, wrapper transparent
- Code & modules: Module `src/utils/resilience.ts` + configuration `src/config/adapters.ts`
- Schéma/DB/Storage: Aucun impact
- Performance/latences: **Amélioration significative** - SLO-optimized (500ms initial, 10s timeout)
- Sécurité/compliance: **Renforcée** - Détection rate limit et configuration environnement
- **Télémétrie**: Métriques complètes (retry, timeout, circuit breaker, succès/échecs)

## Risques et alternatives

- Risques:
  - Retry trop agressif pourrait surcharger services défaillants
  - Configuration inappropriée du circuit breaker
- Atténuations:
  - Backoff exponentiel avec limite max
  - Conditions de retry configurables
  - Tests exhaustifs des cas limites
- Alternatives évaluées:
  - Bibliothèques externes (rejetées pour contrôle et simplicité)
  - Retry linéaire (rejeté pour efficacité)

## Références

- Spécifications: Patterns de résilience standard (Netflix Hystrix, Microsoft patterns)
- Workflows originaux: Gestion d'erreurs basique dans ollama.ts
- Annexes payloads: N/A (infrastructure)

## Limitations

- ~~Ce document implémente un framework générique sans optimisations spécifiques par service~~
- **✅ RÉSOLU**: Configuration spécifique par environnement et service via `PRODUCTION_DEFAULTS`
- ~~Les métriques de performance sont indicatives et dépendent des services externes~~
- **✅ RÉSOLU**: Télémétrie complète avec système de métriques ResilienceMetrics
- ~~Configuration initiale basée sur des valeurs raisonnables, ajustement possible~~
- **✅ RÉSOLU**: Configuration SLO-optimized pour production (500ms, 10s, 5-threshold)

## Suivi Task‑Master

- Tâches liées: 17
- Commandes:
  - `task-master set-status --id=17 --status=completed`
  - `task-master add-evidence --id=17 --file=orchestrator/src/utils/resilience.ts`
  - `task-master add-evidence --id=17 --file=orchestrator/test/integration/resilience.test.ts`
  - `task-master add-evidence --id=17 --file=orchestrator/src/config/adapters.ts`
  - `task-master add-evidence --id=17 --file=orchestrator/test/integration/production-security.test.ts`

## Historique des versions

- v1.0: Création du claim pour Task 17 - Framework de résilience implémenté
- **v1.1**: **Application des recommandations d'audit** - Production-ready avec télémétrie et sécurité

- v1.0: Création du claim pour Task 17 - Framework de résilience implémenté
