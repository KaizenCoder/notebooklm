#!/usr/bin/env node
/*
 Validateur de conventions pour claims/ et audit/
 - Vérifie le pattern de nommage
 - Vérifie le front-matter requis (présence des clés)
 - Vérifie présence d'au moins une ligne "#TEST:"
 - Vérifie présence de la section "## Limitations"
 Retourne code 1 si violations, 0 sinon
*/

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET_DIRS = ['claims', 'audit'];

const FILE_PATTERNS = {
  claim: /^\d{8}_tm-[0-9]+(?:\.[0-9]+)?(?:\+[0-9]+(?:\.[0-9]+)?)*-team-\d{2}-[a-z0-9-]+-[a-z0-9|\-]+-claim(?:_resubmit-\d+)?_v\d+\.\d+\.md$/,
  audit: /^\d{8}_tm-[0-9]+(?:\.[0-9]+)?(?:\+[0-9]+(?:\.[0-9]+)?)*-team-\d{2}-[a-z0-9-]+-[a-z0-9|\-]+-audit_v\d+\.\d+\.md$/,
  submission: /^\d{8}_tm-[0-9]+(?:\.[0-9]+)?(?:\+[0-9]+(?:\.[0-9]+)?)*-team-\d{2}-[a-z0-9-]+-[a-z0-9|\-]+-submission_v\d+\.\d+\.md$/,
};

const REQUIRED_KEYS = [
  'title', 'doc_kind', 'team', 'team_name', 'tm_ids', 'scope',
  'status', 'version', 'author', 'related_files'
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractFrontMatter(raw) {
  if (!raw.startsWith('---')) return { content: raw, fm: null };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { content: raw, fm: null };
  const fmBlock = raw.substring(3, end).trim();
  const content = raw.substring(end + 4).replace(/^\s*\n/, '');
  return { content, fm: fmBlock };
}

function hasAllKeys(fmText) {
  if (!fmText) return false;
  return REQUIRED_KEYS.every((key) => new RegExp(`^${key}:`, 'm').test(fmText));
}

function detectDocKindByName(name) {
  if (/-claim(?:_resubmit-\d+)?_/i.test(name)) return 'claim';
  if (/-audit_/i.test(name)) return 'audit';
  if (/-submission_/i.test(name)) return 'submission';
  return null;
}

function matchesPattern(name, kind) {
  const pat = FILE_PATTERNS[kind];
  if (!pat) return false;
  return pat.test(name);
}

function validateFile(dir, name) {
  const abs = path.join(ROOT, dir, name);
  const raw = readFile(abs);
  const { content, fm } = extractFrontMatter(raw);
  const kindByName = detectDocKindByName(name);

  const issues = [];

  if (!kindByName) {
    issues.push('nommage: impossible de déduire doc_kind (claim/audit/submission) depuis le nom');
  } else if (!matchesPattern(name, kindByName)) {
    issues.push(`nommage: ne correspond pas au pattern ${kindByName}`);
  }

  if (!hasAllKeys(fm || '')) {
    issues.push('front-matter: clés obligatoires manquantes (title, doc_kind, team, team_name, tm_ids, scope, status, version, author, related_files)');
  }

  if (!/^#TEST:/m.test(content)) {
    issues.push('contenu: aucune ligne "#TEST:" trouvée');
  }

  if (!/^##\s+Limitations/m.test(content)) {
    issues.push('contenu: section "## Limitations" absente');
  }

  return { file: path.join(dir, name), issues };
}

function main() {
  const results = [];
  for (const dir of TARGET_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    const entries = fs.readdirSync(absDir);
    for (const name of entries) {
      if (!name.endsWith('.md')) continue;
      if (name.startsWith('README') || name.startsWith('TEMPLATE')) continue;
      // ignorer fichiers déjà conformes connus
      const res = validateFile(dir, name);
      if (res.issues.length > 0) results.push(res);
    }
  }

  if (results.length === 0) {
    console.log('OK: conventions claims/audit respectées');
    process.exit(0);
  } else {
    console.error('Violations de conventions détectées:');
    for (const r of results) {
      console.error(`\n- ${r.file}`);
      for (const issue of r.issues) console.error(`  * ${issue}`);
    }
    process.exit(1);
  }
}

main(); 