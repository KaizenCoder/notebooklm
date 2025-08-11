# Check-list Revue de Parité (Hebdomadaire)

Métadonnées
- Semaine: ____  Date: __/__/____  Heure: __:__
- Participants: Implémenteur(s) ______  Auditeur(s) ______
- Périmètre: (endpoints/flows) __________________________

Préparation
- [ ] Références originales identifiées (`docs/clone/...`)
- [ ] Scénarios de test prêts (oracles: PDF/texte/web/audio)
- [ ] Environnements synchronisés (versions, .env, modèles)

Vérifications par endpoint/flow
- [ ] Requête (payload/headers) conforme
- [ ] Réponse (status/body/shape) conforme
- [ ] Side‑effects DB (tables/rows/metadata/pgvector) conformes
- [ ] Stockage (presence, chemins, ACL) conforme
- [ ] Logs (étapes, erreurs) cohérents
- [ ] UX (affichages, statuts) identiques

Conclusion
- [ ] Parité atteinte: [Oui/Non]
- Écarts relevés: _______________________________
- Décisions prises: (lien `docs/DECISIONS.md` + ID tâche) ______
- Actions de suivi: _____________________________

