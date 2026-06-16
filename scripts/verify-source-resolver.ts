import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  SCHEMA_VERSION,
  SOURCE_PRECEDENCE,
  assertNoSensitiveKeys,
  canStoreUnknownCandidate,
  containsSensitiveKeys,
  coarseTimestampBucket,
  createCandidateId,
  createOverrideId,
  createUnknownCandidate,
  createUserOverride,
  migrationDryRun,
  type ActiveAppContext,
  type SourceKind,
} from '../src/keyhint/localStoreSchema.ts';
import { resolveShortcut, sourceResolverContract, type ShortcutCandidate } from '../src/keyhint/sourceResolver.ts';

const bundleId = 'com.todesktop.230313mzl4w4u92';
const canonicalShortcut = 'Command+P';
const observedAtMs = Date.UTC(2026, 5, 16, 3, 45, 12, 345);
const freshContext: ActiveAppContext = {
  state: 'resolved',
  bundleId,
  displayName: 'Cursor',
  observedAtMs: observedAtMs - 40,
  appVersion: '1.0.0',
};

assert.equal(SCHEMA_VERSION, 1);
assert.deepEqual(SOURCE_PRECEDENCE, [
  'user_override',
  'imported_keybindings',
  'menu_introspection',
  'official_app_source',
  'seed_map',
  'system_map',
  'unknown',
]);
assert.equal(coarseTimestampBucket(observedAtMs), '2026-06-16T03:00:00.000Z');

const candidates: ShortcutCandidate[] = [
  candidate('system_map', 'System fallback'),
  candidate('seed_map', 'Seed map meaning'),
  candidate('official_app_source', 'Official doc meaning'),
  candidate('menu_introspection', 'Menu title meaning'),
  candidate('imported_keybindings', 'Imported user keybindings meaning'),
  candidate('user_override', 'User override meaning'),
];

const resolved = resolveShortcut({ bundleId, canonicalShortcut, candidates });
assert.equal(resolved.matched, true);
assert.equal(resolved.source, 'user_override');
assert.equal(resolved.meaning, 'User override meaning');
assert.equal(resolved.confidence, 'user_verified');
assert.equal(resolved.conflicts.length, 5);
assert.equal(resolved.conflicts[0].source, 'imported_keybindings');

const precedence: SourceKind[] = [...SOURCE_PRECEDENCE];
for (let index = 0; index < precedence.length - 1; index += 1) {
  const winningSource = precedence[index] as SourceKind;
  const lowerSource = precedence[index + 1] as SourceKind;
  const pair = resolveShortcut({
    bundleId,
    canonicalShortcut,
    candidates: [candidate(lowerSource, `lower ${lowerSource}`), candidate(winningSource, `winner ${winningSource}`)],
  });
  assert.equal(pair.source, winningSource);
}

const unknownResult = resolveShortcut({ bundleId, canonicalShortcut: 'Command+Shift+X', candidates });
assert.equal(unknownResult.matched, false);
assert.equal(unknownResult.source, 'unknown');
assert.equal(unknownResult.meaning, null);

const candidateIdA = createCandidateId({ bundleId, canonicalShortcut, appVersion: '1.0.0', observedAtMs });
const candidateIdB = createCandidateId({ bundleId, canonicalShortcut, appVersion: '1.0.0', observedAtMs: observedAtMs + 1000 });
assert.equal(candidateIdA, candidateIdB, 'candidateId is stable inside one coarse timestamp bucket');
assert.notEqual(candidateIdA, createCandidateId({ bundleId, canonicalShortcut, appVersion: '1.0.0', observedAtMs: observedAtMs + 60 * 60 * 1000 }));
assert.equal(createOverrideId(bundleId, canonicalShortcut), createOverrideId(bundleId, canonicalShortcut));
assert.notEqual(createOverrideId(bundleId, canonicalShortcut), createOverrideId(bundleId, 'Command+Shift+P'));

const unknownCandidate = createUnknownCandidate({ context: freshContext, canonicalShortcut: 'Command+Shift+X', eventObservedAtMs: observedAtMs });
assert.ok(unknownCandidate);
assert.equal(unknownCandidate?.source, 'unknown');
assert.equal(unknownCandidate?.rawTextStored, false);
assert.equal(unknownCandidate?.observedAtBucket, '2026-06-16T03:00:00.000Z');
assertNoSensitiveKeys(unknownCandidate);
assert.equal(containsSensitiveKeys(unknownCandidate), false);
assert.equal(JSON.stringify(unknownCandidate).includes('rawKeyStream'), false);
assert.equal(JSON.stringify(unknownCandidate).includes('password'), false);
assert.equal(JSON.stringify(unknownCandidate).includes('imeText'), false);

const staleContext: ActiveAppContext = { ...freshContext, state: 'stale_context', observedAtMs: observedAtMs - 5000 };
const resolverUnavailable: ActiveAppContext = { state: 'resolver_unavailable', bundleId: null, displayName: null, observedAtMs };
assert.equal(canStoreUnknownCandidate(staleContext, observedAtMs), false);
assert.equal(canStoreUnknownCandidate(resolverUnavailable, observedAtMs), false);
assert.equal(createUnknownCandidate({ context: staleContext, canonicalShortcut, eventObservedAtMs: observedAtMs }), null);
assert.equal(createUnknownCandidate({ context: resolverUnavailable, canonicalShortcut, eventObservedAtMs: observedAtMs }), null);

const override = createUserOverride({
  bundleId,
  displayName: 'Cursor',
  canonicalShortcut,
  meaning: 'Open file by name',
  updatedAtMs: observedAtMs,
});
assert.equal(override.overrideId, createOverrideId(bundleId, canonicalShortcut));
assert.equal(override.rawTextStored, false);
assertNoSensitiveKeys(override);

const dryRun = migrationDryRun(
  [
    { id: 'known-1', schemaVersion: 1 },
    { id: 'old-1', schemaVersion: 0 },
  ],
  1,
  2,
);
assert.deepEqual(dryRun, {
  beforeVersion: 1,
  afterVersion: 2,
  wouldMigrate: true,
  recordCount: 2,
  conflicts: [{ id: 'old-1', reason: 'expected schemaVersion 1, found 0' }],
  destructive: false,
});

const contract = sourceResolverContract();
assert.equal(contract.schemaVersion, 1);
assert.equal(contract.unresolvedContextStoresUnknown, false);
assert.equal(contract.rawTextStored, false);

const diagnostics = JSON.parse(execFileSync('node', ['scripts/keyhint.mjs', 'diagnostics:redact'], { encoding: 'utf8' }));
assert.equal(diagnostics.rawText, '[REDACTED]');
assert.equal(diagnostics.rawKeyStream, '[REDACTED]');

function candidate(source: SourceKind, meaning: string): ShortcutCandidate {
  return {
    bundleId,
    canonicalShortcut,
    meaning,
    source,
    rawTextStored: false,
  };
}

console.log('source resolver and local store schema contract ok');
