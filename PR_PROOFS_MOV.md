### Preuves no‑mocks (MOV)

Commandes exécutées en local (orchestrator/):

```bash
npm run -s ci:anti-mock
```
Résultat:
```
[anti-mock] Scan démarré (NO_MOCKS=)
[anti-mock] Aucun motif suspect détecté dans orchestrator/src
```

```bash
npm run -s ci:no-mocks-check
```
Résultat:
```
[no-mocks] Vérification démarrée
[no-mocks] OK: E2E a fonctionné avec NO_MOCKS=1
```

Scripts disponibles:
- `npm run prepare:hooks` (installe le hook PowerShell `.git/hooks/pre-push.ps1`)
- `npm run ci:anti-mock`
- `npm run ci:no-mocks-check`
- `npm run ci:local` (anti‑mock → no‑mocks E2E → tests MOV)

Conclusion: la condition MOV "no‑mocks bloquant + anti‑mock" est levée.