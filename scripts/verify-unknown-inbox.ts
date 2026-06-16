import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertNoSensitiveKeys, createUnknownCandidate, type ActiveAppContext } from '../src/keyhint/localStoreSchema.ts';
import {
  addUnknownCandidate,
  createEmptyUnknownInbox,
  ignoreUnknownCandidate,
  importLabeledUnknown,
  labelUnknownCandidate,
  listActionableUnknowns,
  summarizeUnknownInbox,
} from '../src/keyhint/unknownInbox.ts';

const observedAtMs = Date.UTC(2026, 5, 16, 5, 12, 0, 0);
const context: ActiveAppContext = {
  state: 'resolved',
  bundleId: 'com.todesktop.230313mzl4w4u92',
  displayName: 'Cursor',
  observedAtMs,
  appVersion: '1.0.0',
};
const candidate = createUnknownCandidate({ context, canonicalShortcut: 'Command+Shift+X', eventObservedAtMs: observedAtMs });
assert.ok(candidate);

let inbox = createEmptyUnknownInbox();
inbox = addUnknownCandidate(inbox, candidate);
assert.equal(inbox.items.length, 1);
assert.equal(inbox.items[0].status, 'new');
assert.equal(inbox.items[0].seenCount, 1);
assert.equal(inbox.items[0].rawTextStored, false);

inbox = addUnknownCandidate(inbox, candidate);
assert.equal(inbox.items.length, 1, 'duplicate candidate updates the same row');
assert.equal(inbox.items[0].seenCount, 2);

inbox = labelUnknownCandidate(inbox, candidate.candidateId, 'Run selected command', observedAtMs);
assert.equal(inbox.items[0].status, 'labeled');
assert.equal(inbox.items[0].label?.meaning, 'Run selected command');
assert.equal(listActionableUnknowns(inbox).length, 1);
assertNoSensitiveKeys(inbox);

const imported = importLabeledUnknown(inbox, candidate.candidateId, observedAtMs + 1000);
inbox = imported.state;
assert.equal(inbox.items[0].status, 'imported');
assert.equal(inbox.items[0].overrideId, imported.override.overrideId);
assert.equal(imported.override.meaning, 'Run selected command');
assert.equal(imported.override.rawTextStored, false);
assert.equal(summarizeUnknownInbox(inbox).imported, 1);
assert.equal(listActionableUnknowns(inbox).length, 0);

const ignoredCandidate = createUnknownCandidate({ context, canonicalShortcut: 'Command+Option+I', eventObservedAtMs: observedAtMs });
assert.ok(ignoredCandidate);
inbox = addUnknownCandidate(inbox, ignoredCandidate);
inbox = ignoreUnknownCandidate(inbox, ignoredCandidate.candidateId, observedAtMs);
assert.equal(summarizeUnknownInbox(inbox).ignored, 1);

assert.throws(() => addUnknownCandidate(inbox, { ...candidate, rawText: 'secret' } as never), /sensitive raw input/);
assert.throws(() => importLabeledUnknown(addUnknownCandidate(createEmptyUnknownInbox(), ignoredCandidate), ignoredCandidate.candidateId, observedAtMs), /labeled before import/);

const tmp = mkdtempSync(join(tmpdir(), 'keyhint-unknown-inbox-'));
const storePath = join(tmp, 'unknown-inbox.json');
const env = { ...process.env, KEYHINT_STORE_PATH: storePath };
function run(args: string[]) {
  return execFileSync('node', ['scripts/keyhint.mjs', ...args], { encoding: 'utf8', env });
}

const added = JSON.parse(run(['unknown:add', '--bundle-id', context.bundleId, '--app', context.displayName, '--shortcut', 'Command+Shift+X', '--observed-at', String(observedAtMs), '--app-version', '1.0.0']));
assert.equal(added.ok, true);
assert.equal(added.item.status, 'new');
const listed = JSON.parse(run(['unknown:list']));
assert.equal(listed.summary.new, 1);
const labeled = JSON.parse(run(['unknown:label', '--id', added.item.candidate.candidateId, '--meaning', 'Run selected command', '--at', String(observedAtMs)]));
assert.equal(labeled.item.status, 'labeled');
const importedCli = JSON.parse(run(['unknown:import', '--id', added.item.candidate.candidateId, '--at', String(observedAtMs + 1000)]));
assert.equal(importedCli.item.status, 'imported');
assert.equal(importedCli.override.meaning, 'Run selected command');
const ignoredCliAdd = JSON.parse(run(['unknown:add', '--bundle-id', context.bundleId, '--app', context.displayName, '--shortcut', 'Command+Option+I', '--observed-at', String(observedAtMs)]));
const ignoredCli = JSON.parse(run(['unknown:ignore', '--id', ignoredCliAdd.item.candidate.candidateId, '--at', String(observedAtMs)]));
assert.equal(ignoredCli.item.status, 'ignored');
const stored = JSON.parse(readFileSync(storePath, 'utf8'));
assert.equal(JSON.stringify(stored).includes('rawKeyStream'), false);
assert.equal(JSON.stringify(stored).includes('password'), false);
assert.equal(JSON.stringify(stored).includes('imeText'), false);
rmSync(tmp, { recursive: true, force: true });

console.log('unknown inbox flow ok');
