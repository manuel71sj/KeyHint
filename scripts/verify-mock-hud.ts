import assert from 'node:assert/strict';
import { createMockHudState, normalizeShortcut } from '../src/keyhint/mockHud.ts';

assert.equal(normalizeShortcut('Command+Shift+X'), '⌘ ⇧ X');
assert.equal(normalizeShortcut('Control+Option+P'), '⌃ ⌥ P');

const known = createMockHudState({ mode: 'known', shortcut: 'Command+P', app: 'Cursor', meaning: 'Go to File', source: 'imported keybindings' });
assert.equal(known.headline, 'Go to File');
assert.equal(known.shortcut, '⌘ P');
assert.equal(known.meta, 'Cursor · Verified · Source: imported keybindings');
assert.equal(known.storesRawText, false);

const unknown = createMockHudState({ mode: 'unknown', shortcut: 'Command+Shift+X', app: 'Cursor' });
assert.equal(unknown.headline, 'Not learned yet in Cursor');
assert.equal(unknown.shortcut, '⌘ ⇧ X');
assert.match(unknown.meta, /Saved to Unknowns/);
assert.match(unknown.meta, /No raw text stored/);
assert.equal(unknown.storesRawText, false);

const permission = createMockHudState({ mode: 'permission' });
assert.equal(permission.headline, 'KeyHint cannot see shortcuts yet');
assert.equal(permission.shortcut, 'Input Monitoring is disabled');
assert.match(permission.meta, /Open System Settings/);
assert.equal(permission.storesRawText, false);

console.log('mock HUD contract ok');
