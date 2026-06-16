import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = readFileSync('docs/distribution-readiness.md', 'utf8');
for (const phrase of [
  'Signed/notarized production release: NOT READY',
  'Developer ID Application certificate',
  'notarytool',
  'stapled artifact',
  'No-network checklist',
  'GitHub Release checklist',
  'SHA-256 checksum',
  'local-only, no raw text/raw key stream',
  'Release notes skeleton',
  'Rollback plan',
]) {
  assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(doc, /npm run test/);
assert.match(doc, /npm run lint:rust/);
console.log('distribution readiness contract ok');
