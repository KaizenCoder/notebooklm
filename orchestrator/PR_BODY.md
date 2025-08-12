# TM-8 TM-18: Adapters finalized; GPU-only guard on webhooks

## Summary
- Finalizes adapter wiring and validates with contract tests.
- Adds runtime GPU-only enforcement on key webhook routes with clear 503 error behavior.

## Scope
- Orchestrator runtime only; no contract or OpenAPI changes.
- Affects `chat`, `process-document`, `process-additional-sources` runtime behavior when `GPU_ONLY=1`.

## Changes
- `orchestrator/src/app.ts`: add cached GPU probe and enforce on `/webhook/chat`, `/webhook/process-document`, `/webhook/process-additional-sources`.
- `orchestrator/test/contract/gpu-runtime-guard.test.ts`: contract test asserting 503 with code `GPU_REQUIRED` when probe fails.
- Adapters verified in tests: PG, Storage (`fetchText`, `upload` mock), Ollama, Whisper, Audio (mock Coqui).

## GPU-Only Enforcement
- Env `GPU_ONLY=1` + `OLLAMA_EMBED_MODEL` → checks GPU via `ollama.checkGpu`.
- Failing probe returns `503` `{ code: "GPU_REQUIRED", message, correlation_id }`.
- Probe cached ~15s to limit overhead.

## Endpoints Affected
- `POST /webhook/chat`
- `POST /webhook/process-document`
- `POST /webhook/process-additional-sources`

## Tests
- Contract tests pass locally, including new: `gpu-runtime-guard.test.ts`.
- Run: `cd orchestrator && npm run test:contract`.

## How To Verify Locally
```bash
GPU_ONLY=1 OLLAMA_EMBED_MODEL=nomic-embed-text NOTEBOOK_GENERATION_AUTH="secret" \
  tsx test/contract/gpu-runtime-guard.test.ts
```
- Expect `503` with `code="GPU_REQUIRED"` on the routes above.

## ENV Requirements
- `NOTEBOOK_GENERATION_AUTH`: required.
- `OLLAMA_BASE_URL`: default `http://ollama:11434`.
- `OLLAMA_EMBED_MODEL`: required when `GPU_ONLY=1`.
- `POSTGRES_DSN`: optional for tests (DB calls mocked).
- Optional: `IDEMPOTENCY_TTL_MS`.

## Risks/Impact
- Enforcement only triggers when `GPU_ONLY=1`; otherwise no behavior change.
- No contract shape changes; aligns with TECHNICAL_GUIDELINES (GPU-only).

## Follow-Ups
- Swap Audio mock for real Coqui client behind `createAudio` if/when available.
- Consider exposing a minimal `/ready` metric for GPU probe timing if needed.

## Task‑Master
- TM-8: Service adapters implemented and validated.
- TM-18: Runtime guard implemented; keep task open if additional checks are desired.

## Checklist
- [x] Adapters wired and mockable.
- [x] GPU-only runtime guard added and tested.
- [x] No contract changes; specs remain valid.
- [x] Contract tests pass locally.
- [ ] PR approved by Auditeur.
