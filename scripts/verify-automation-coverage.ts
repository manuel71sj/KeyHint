import assert from 'node:assert/strict';
import { canStartShortcutCollector, permissionRecoveryAction, shouldPauseForSensitiveContext } from '../src/keyhint/permissionPolicy.ts';
import { redactDiagnostics, assertRedacted } from '../src/keyhint/redaction.ts';
import { resolveShortcut, type ShortcutCandidate } from '../src/keyhint/sourceResolver.ts';
import { createShortcutQueue, enqueueShortcutEvent } from '../src/keyhint/shortcutEventQueue.ts';
import { isShortcutCaptureCandidate, normalizeCanonicalShortcut } from '../src/keyhint/shortcutNormalizer.ts';

assert.equal(normalizeCanonicalShortcut('shift + command + p').canonical, 'Command+Shift+P');
assert.equal(normalizeCanonicalShortcut('⌘ ⌥ k').canonical, 'Command+Option+K');
assert.equal(isShortcutCaptureCandidate('a'), false);
assert.equal(isShortcutCaptureCandidate('Command'), false);
assert.equal(isShortcutCaptureCandidate('Command+A'), true);

const candidates: ShortcutCandidate[] = [
  { bundleId: 'app', canonicalShortcut: 'Command+P', meaning: 'seed', source: 'seed_map', rawTextStored: false },
  { bundleId: 'app', canonicalShortcut: 'Command+P', meaning: 'override', source: 'user_override', rawTextStored: false },
];
const match = resolveShortcut({ bundleId: 'app', canonicalShortcut: 'Command+P', candidates });
assert.equal(match.source, 'user_override');
assert.equal(match.conflicts.length, 1);

let queue = createShortcutQueue();
queue = enqueueShortcutEvent(queue, { shortcut: 'a', observedAtMs: 10 }, { maxDepth: 2 });
assert.equal(queue.dropped, 1);
queue = enqueueShortcutEvent(queue, { shortcut: 'Command+P', observedAtMs: 100 }, { maxDepth: 2 });
queue = enqueueShortcutEvent(queue, { shortcut: '⌘ P', observedAtMs: 150 }, { maxDepth: 2 });
assert.equal(queue.events.length, 1);
assert.equal(queue.coalesced, 1);
queue = enqueueShortcutEvent(queue, { shortcut: 'Command+Shift+P', observedAtMs: 300 }, { maxDepth: 2 });
queue = enqueueShortcutEvent(queue, { shortcut: 'Command+Option+K', observedAtMs: 500 }, { maxDepth: 2 });
assert.equal(queue.events.length, 2);
assert.equal(queue.dropped, 2);
queue = enqueueShortcutEvent(queue, { shortcut: 'Command+L', observedAtMs: 600, sensitiveContext: true }, { maxDepth: 2 });
assert.equal(queue.paused, true);

assert.equal(canStartShortcutCollector('granted'), true);
assert.equal(canStartShortcutCollector('denied'), false);
assert.equal(permissionRecoveryAction('denied'), 'open_system_settings_input_monitoring');
assert.equal(permissionRecoveryAction('revoked_during_run'), 'stop_collector_and_request_restart');
assert.equal(shouldPauseForSensitiveContext({ secureInput: true }), true);
assert.equal(shouldPauseForSensitiveContext({ imeComposing: true }), true);

const redacted = redactDiagnostics({
  rawText: 'secret',
  nested: { rawKeyStream: 'raw-key-stream', password: 'password-value', imeText: 'ime-composing' },
  safe: 'Command+P',
});
assert.equal(redacted.rawText, '[REDACTED]');
assert.equal(redacted.nested.rawKeyStream, '[REDACTED]');
assert.equal(redacted.nested.password, '[REDACTED]');
assert.equal(redacted.nested.imeText, '[REDACTED]');
assert.equal(redacted.safe, 'Command+P');
assertRedacted(redacted);

console.log('automation coverage contract ok');
