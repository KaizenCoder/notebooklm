# Finalization Plan — NotebookLM Local Clone

**Objective**
- Achieve strict parity with the original by replacing n8n with the local Orchestrator, keeping identical UX/flows via Supabase Edge Functions.

**Phases**
- PDF Bridge (Task 16)
- CI Offline (Task 12)
- Docs Sync (Task 13)
- FE Local Integration
- Parity Review & Evidence

**PDF Bridge**
- Implement Python bridge for PDF extraction with timeouts and max pages.
- Wire into document ingestion pipeline; respect metadata/loc.lines.
- Tests: unit for extraction edge cases; integration in orchestrator.
- Exit: large PDF and edge cases processed; dims/metadata validated.

**CI Offline**
- Run contract/integration/E2E without external network.
- Collect logs on failure as artifacts.
- Exit: green pipeline locally; artifacts present on failures.

**Docs Sync**
- Verify `WEBHOOKS_MAPPING.md` and `ANNEXES_PAYLOADS.md` match implementation.
- Link key decisions in `DECISIONS.md` if any adaptation was validated.
- Exit: cross-refs and links validated.

**FE Local Integration**
- Configure Supabase secrets → Orchestrator endpoints (see setup/secrets matrix).
- Smoke tests: chat, process-document, additional-sources (2 types), audio.
- Exit: FE shows chat responses and updated notebook/source states.

**Parity Review & Evidence**
- Use `PARITY_REVIEW_CHECKLIST.md` items covering endpoints, payloads, statuses, DB side-effects.
- Collect: logs snippets (correlation_id), DB snapshots, FE screenshots.
- Exit: auditor verdict APPROVED; claim published with STATUS_UPDATE on Redis (agents:pair:<team>) before pushing claim file.

**Readiness Gates**
- `/ready` returns 200; GPU-only enforced when enabled; models present.
- Redis heartbeats compliant; status/audit events published as required (STATUS_UPDATE before claims, AUDIT_REQUEST/VERDICT around audits).

**Timing (Estimate)**
- PDF Bridge: 1.5–2.5 days
- CI Offline: 0.5–1.0 day
- Docs Sync: 0.25–0.5 day
- FE Integration: 1.0–1.5 days
- Parity/Audit: 0.5–0.75 day
- Total: 4–6 days (±20%)

