#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve project root from script location (../)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const bundleFiles = [
  'audit/20250812_tm-19-team-02-ingestion-audit_v1.0.md',
  'audit/20250812_tm-19-team-02-ingestion-submission-ready-audit_v1.0.md',
  'audit/20250812_tm-10-team-01-foundations-logging-submission-ready-audit_v1.0.md',
  'claims/20250812_tm-1+3+4+10-team-00-global-submission-claim_v1.1.md',
  'claims/20250812_tm-1+3+4+10-team-00-global-annexes_v1.0.md',
  'docs/spec/openapi.yaml',
  'docs/spec/process-document.yaml',
  'docs/spec/process-additional-sources.yaml'
];

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const results = [];
  for (const rel of bundleFiles) {
    const abs = resolve(projectRoot, rel);
    const ok = await exists(abs);
    results.push({ file: rel, exists: ok });
  }
  const missing = results.filter(r => !r.exists).map(r => r.file);
  const outputJson = process.argv.includes('--json');
  if (outputJson) {
    const payload = { ok: missing.length === 0, missing, checked: results };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    if (missing.length === 0) {
      console.log(`OK: ${results.length}/${results.length} fichiers présents.`);
    } else {
      console.error(`ERREUR: fichiers manquants (${missing.length}):`);
      for (const m of missing) console.error(` - ${m}`);
    }
  }
  process.exit(missing.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error('Unexpected error', e); process.exit(2); });
