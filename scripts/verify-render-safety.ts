import assert from 'node:assert/strict';
import { escapeHtml } from '../src/keyhint/htmlEscape.ts';
import { createMockHudState } from '../src/keyhint/mockHud.ts';

const payload = '<img src=x onerror=alert(1)> & "quoted"';
assert.equal(escapeHtml(payload), '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot;');

const hud = createMockHudState({ mode: 'known', shortcut: 'Command+P', app: payload, meaning: payload, source: payload });
const rendered = `<strong>${escapeHtml(hud.headline)}</strong><span>${escapeHtml(hud.meta)}</span>`;
assert.equal(rendered.includes('<img'), false);
assert.equal(rendered.includes('onerror=alert'), true, 'payload text may remain as escaped literal text');
assert.match(rendered, /&lt;img/);

console.log('render safety contract ok');
