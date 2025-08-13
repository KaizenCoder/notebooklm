## Infos Tâches
- IDs Task‑Master: TM-...
- Portée: SPEC | IMPL | TEST | AUDIT | DOC (sélectionner)

## Référence Continue (Obligatoire)
- Source originale (docs/clone/...):
  - [ ] Chemins/liaisons précises (fichier + ligne si pertinent)
- Adaptations validées:
  - [ ] Lien `docs/DECISIONS.md` + justification/impact

## Contrats & Parité
- [ ] Contrats alignés (payloads/headers/status) vs modèle
- [ ] Side‑effects DB conformes (tables, RPC, schémas)

## Redis (Obligatoire)
- Claims:
  - [ ] `STATUS_UPDATE` publié avant création/modif dans `claims/`
  - [ ] IDs/Logs des messages Redis référencés ici
- Audits:
  - [ ] `AUDIT_REQUEST` (impl→audit) / `AUDIT_VERDICT` (audit→impl) publiés
  - [ ] IDs/Logs référencés

## Preuves #TEST (Obligatoire)
- [ ] Logs avec `correlation_id`
- [ ] Captures FE (si UI)
- [ ] Extraits DB/SQL (si applicable)

## Limitations
- [ ] Section `## Limitations` renseignée dans les docs concernées

## Validation Auditeur (Gate)
- Auditeur: ...
- Verdict: APPROVED | CHANGES_REQUESTED


