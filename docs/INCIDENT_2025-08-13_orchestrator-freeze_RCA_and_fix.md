# Orchestrator freeze (DB/Ollama) — RCA and Fix (2025-08-13)

## Summary
- Symptom: Orchestrator failed boot checks (DB auth errors), then Ollama models marked missing; later server failed to bind port 8000.
- Root causes:
  - PostgreSQL config error (`host_auth_method` invalid) and DB name/secret mismatches.
  - Host port conflicts: Windows PostgreSQL service bound to 5432; another app bound to 8000.
  - Env discrepancies: `localhost` vs `127.0.0.1` for Ollama; model tag mismatch (`nomic-embed-text` vs `nomic-embed-text:latest`).
- Outcome: All services aligned; orchestrator boots and listens on 8080; DB/Ollama checks pass.

## Symptoms
- DB: `FATAL: password authentication failed for user "notebook"` and `database "notebooklm" does not exist`.
- Postgres failed to start with: `unrecognized configuration parameter "host_auth_method"`.
- Orchestrator: “Ollama models: MISSING” despite models present.
- Server bind error: `EACCES: permission denied 0.0.0.0:8000`.

## Root cause analysis
1. PostgreSQL
   - Invalid parameter `host_auth_method` in `postgresql.conf` stopped startup.
   - DB name mismatch across compose, healthcheck, and app DSN (e.g., `notebooklm` vs `agent_memory_notebooklm`).
   - Password mismatch due to secrets vs plaintext divergence.
   - Host port 5432 already occupied by Windows service `postgresql-x64-17` caused ambiguous connectivity.
2. Ollama
   - `localhost` returned empty tags for the Node process while `127.0.0.1` returned the model list.
   - Env var precedence allowed external env to override `.env` values.
   - Embed model tag mismatch with installed name required `:latest`.
3. Orchestrator
   - Port 8000 already bound by a `Manager` process resulted in EACCES on listen.

## Fix strategy (applied)
1. PostgreSQL
   - Removed invalid `host_auth_method` from `infra/config/postgresql/postgresql.conf`.
   - Ensured `infra/config/postgresql/pg_hba.conf` allows md5 for host connections.
   - Unified DB name and credentials: `agent_memory_notebooklm`, user `notebook`, password `notebook`.
   - Moved published port to avoid conflict: `55432:5432` in `infra/docker-compose.yml`.
   - Reset DB user password inside the container and verified TCP auth.
2. Env alignment
   - Set DSN everywhere to `postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm` in `.env` files.
   - Forced `.env` to override host env in app by changing `src/env.ts` to `config({ override: true })`.
3. Ollama configuration
   - Used `OLLAMA_BASE_URL=http://127.0.0.1:11434` (not `localhost`).
   - Normalized model names to installed tags: `nomic-embed-text:latest` and `phi3:mini`.
4. Orchestrator port
   - Switched `PORT=8080` in `orchestrator/.env` to avoid conflict with port 8000.

## Files changed
- `infra/docker-compose.yml`: publish Postgres on 55432; consistent env and healthcheck.
- `infra/config/postgresql/postgresql.conf`: removed invalid setting; tuned basics.
- `infra/config/postgresql/pg_hba.conf`: md5 for host connections (IPv4/IPv6).
- `infra/postgres/init/01-init-db.sh`: creates pgvector extension, schema, and grants; ensures password.
- `.env` and `orchestrator/.env`: unified `POSTGRES_DSN`, `OLLAMA_BASE_URL`, models, and `PORT=8080`.
- `orchestrator/src/env.ts`: `dotenv` now loads with `{ override: true }`.

## Verification
1. Postgres health
   - Container: Up (healthy). Port mapping `0.0.0.0:55432->5432/tcp`.
   - TCP auth test:
     - From host: `psql "postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm" -c "select 1;"`
2. Ollama models
   - API: `GET http://127.0.0.1:11434/api/tags` shows `phi3:mini` and `nomic-embed-text:latest`.
3. Orchestrator boot
   - Logs show: `DB connection: OK`, `Ollama models: OK`, `GPU probe: OK`.
   - Listening: `http://0.0.0.0:8080`.
4. Smoke tests
   - Health: `GET http://127.0.0.1:8080/health` → `{ status: 'ok' }`.
   - Ready: `GET http://127.0.0.1:8080/ready` (models must be installed).

## Operational notes
- Prefer `127.0.0.1` over `localhost` for Ollama to avoid resolver inconsistencies.
- If you need the standard ports (5432/8000), stop the conflicting Windows services/processes or change their ports:
  - Windows Postgres service: `postgresql-x64-17`.
  - Process on 8000: `Manager` (PID varies).
- Keep DB name consistent across compose, init scripts, healthchecks, and DSNs.
- If using Docker secrets for DB password, ensure the app uses the same value (or inject it from the secret at runtime).

## Quick recovery checklist
- Postgres
  - [ ] `docker-compose ps` shows postgres healthy
  - [ ] `psql` TCP auth works to the expected DB with the expected user
  - [ ] Port mapping is not conflicting on the host
- Env
  - [ ] `orchestrator/.env` DSN points to 127.0.0.1:55432/agent_memory_notebooklm
  - [ ] `src/env.ts` uses `config({ override: true })`
- Ollama
  - [ ] Base URL is 127.0.0.1:11434
  - [ ] Models installed match env tags (e.g., `nomic-embed-text:latest`)
- Orchestrator
  - [ ] PORT not in use (we use 8080)
  - [ ] `/health` and `/ready` return OK

## Commands (PowerShell)
```powershell
# Postgres status
cd .\infra
docker-compose ps

# Test DB auth from host
psql "postgres://notebook:notebook@127.0.0.1:55432/agent_memory_notebooklm" -c "select 1;"

# List Ollama models
Invoke-RestMethod -Uri http://127.0.0.1:11434/api/tags | ConvertTo-Json -Depth 4

# Check ports in use
Get-NetTCPConnection -LocalPort 5432,8000 -State Listen | Format-Table -AutoSize

# Start orchestrator
cd ..\orchestrator
npm run build
node dist/index.js
```

---
Prepared by: Team Orange — Impl
Date: 2025-08-13
