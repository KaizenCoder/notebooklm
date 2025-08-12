#!/usr/bin/env bash
set -euo pipefail
redis-cli XADD coordination_heartbeat "*" \
  from_agent "${FROM_AGENT:-impl_bot}" \
  team "${TEAM:-orange}" \
  role "${ROLE:-impl}" \
  tm_ids "${TM_IDS:-[\"1\"]}" \
  task_id "${TASK_ID:-1}" \
  event "${EVENT:-TASK_START}" \
  status "${STATUS:-IN_PROGRESS}" \
  severity "${SEVERITY:-INFO}" \
  timestamp "$(date -Is)" \
  correlation_id "${CORRELATION_ID:-$(uuidgen)}"
