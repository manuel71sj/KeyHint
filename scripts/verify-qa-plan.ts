import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const qa = readFileSync('docs/qa-dogfood.md', 'utf8');
for (const scenario of [
  'standard desktop HUD',
  'fullscreen Spaces',
  'Stage Manager',
  'multi-display',
  'remote desktop',
  'reduced motion',
  'Input Monitoring grant/revoke/relaunch',
  'Secure Event Input',
  'IME composing/dead key',
  'password field suppression',
  '10x shortcut burst',
]) {
  assert.match(qa, new RegExp(scenario.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(qa, /Automated repo-local QA: PASS/);
assert.match(qa, /Manual macOS dogfood: READY, not executed/);
assert.match(qa, /HTTP 200/);
console.log('QA dogfood plan contract ok');
