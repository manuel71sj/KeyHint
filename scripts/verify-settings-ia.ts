import assert from 'node:assert/strict';
import { getSettingsSection, settingsCompletionChecks, settingsDirection, settingsSections } from '../src/keyhint/settingsIa.ts';

const required = ['status', 'privacy', 'hud', 'sources', 'unknowns', 'apps', 'diagnostics'];
assert.deepEqual(settingsSections.map((section) => section.id), required);
assert.equal(settingsSections.length, 7);

for (const section of settingsSections) {
  assert.ok(section.title.length > 4);
  assert.ok(section.intent.length > 12);
  assert.ok(section.userTask.length > 8);
  assert.ok(section.primaryAction.length > 4);
  assert.ok(section.proofPoints.length >= 3);
}

assert.equal(getSettingsSection('unknowns').label, 'Unknowns');
assert.equal(getSettingsSection('missing').id, 'status');
assert.match(settingsDirection.signature, /capture-to-meaning rail/);
assert.ok(settingsDirection.domain.includes('source precedence ladder'));
assert.ok(settingsDirection.colorWorld.some((color) => color.includes('keycap')));
assert.equal(settingsDirection.rejectedDefaults.length, 3);
assert.ok(settingsCompletionChecks().some((check) => check.includes('Status/Privacy/HUD/Sources/Unknowns/Apps/Diagnostics')));

console.log('settings IA scaffold ok');
