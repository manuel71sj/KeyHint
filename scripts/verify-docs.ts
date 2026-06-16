import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const privacy = readFileSync('docs/privacy.md', 'utf8');
assert.match(privacy, /Local-only defaults/);
assert.match(privacy, /rawText/);
assert.match(privacy, /rawKeyStream/);
assert.match(privacy, /Input Monitoring/);
assert.match(privacy, /Diagnostics redaction/);

const troubleshooting = readFileSync('docs/troubleshooting.md', 'utf8');
for (const heading of [
  'Input Monitoring denied',
  'Event tap disabled',
  'Overlay fallback needed',
  'No active app',
  'Stale app context',
  'Secure input paused',
  'Local store unavailable',
  'Map conflict',
  'Not signed/notarized',
]) {
  assert.match(troubleshooting, new RegExp(`## ${heading}`));
}
assert.match(troubleshooting, /Problem:/);
assert.match(troubleshooting, /Cause:/);
assert.match(troubleshooting, /Fix:/);
assert.match(troubleshooting, /Verify:/);

const release = readFileSync('docs/release.md', 'utf8');
assert.match(release, /Pre-release gates/);
assert.match(release, /macOS distribution/);
assert.match(release, /Manual QA matrix/);
assert.match(release, /No-network\/default-local verification/);
assert.match(release, /Release notes template/);

console.log('docs contract ok');
