import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

function run(args) {
  return execFileSync('node', ['scripts/keyhint.mjs', ...args], { encoding: 'utf8' });
}

const doctor = JSON.parse(run(['doctor']));
assert.equal(doctor.ok, true);
assert.equal(doctor.localOnly, true);
assert.equal(doctor.storesRawText, false);
assert.equal(doctor.checks.tauriConfig, true);

const known = run(['hud:test', '--shortcut', 'Command+P', '--app', 'Cursor', '--meaning', 'Go to File', '--source', 'imported keybindings']);
assert.match(known, /Go to File/);
assert.match(known, /⌘ P/);
assert.match(known, /Cursor · Verified/);

const unknown = run(['hud:test', '--shortcut', 'Command+Shift+X', '--app', 'Cursor', '--unknown']);
assert.match(unknown, /Not learned yet in Cursor/);
assert.match(unknown, /⌘ ⇧ X/);
assert.match(unknown, /No raw text stored/);

const permission = run(['hud:test', '--permission', 'denied']);
assert.match(permission, /KeyHint cannot see shortcuts yet/);
assert.match(permission, /Input Monitoring is disabled/);

const permissions = JSON.parse(run(['permissions:check']));
assert.equal(permissions.collectorStarted, false);
assert.equal(permissions.inputMonitoring, 'manual_check_required');

const maps = JSON.parse(run(['maps:validate']));
assert.equal(maps.ok, true);
assert.equal(maps.checked, 1);

const out = '.tmp/diagnostics-redacted.json';
run(['diagnostics:redact', '--out', out]);
const redacted = JSON.parse(readFileSync(out, 'utf8'));
assert.equal(redacted.rawText, '[REDACTED]');
assert.equal(redacted.rawKeyStream, '[REDACTED]');
rmSync('.tmp', { recursive: true, force: true });

console.log('keyhint CLI contract ok');
