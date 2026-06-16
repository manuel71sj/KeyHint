export const SCHEMA_VERSION = 1;
export const FRESHNESS_WINDOW_MS = 250;
export const TIMESTAMP_BUCKET_MS = 60 * 60 * 1000;

export const SOURCE_PRECEDENCE = [
  'user_override',
  'imported_keybindings',
  'menu_introspection',
  'official_app_source',
  'seed_map',
  'system_map',
  'unknown',
] as const;

export type SourceKind = (typeof SOURCE_PRECEDENCE)[number];

export type MatchConfidence =
  | 'user_verified'
  | 'imported'
  | 'menu'
  | 'official'
  | 'seed'
  | 'system'
  | 'unknown';

export type ActiveAppContextState =
  | 'resolved'
  | 'no_active_app'
  | 'stale_context'
  | 'resolver_unavailable';

export type ActiveAppContext = {
  state: ActiveAppContextState;
  bundleId: string | null;
  displayName: string | null;
  observedAtMs: number;
  appVersion?: string | null;
};

export type ShortcutSourceMetadata = {
  kind: SourceKind;
  version: string;
  importedAtBucket?: string;
  verifiedAtBucket?: string;
  appVersion?: string;
  url?: string;
  rawTextStored: false;
};

export type ShortcutMapEntry = {
  canonicalShortcut: string;
  meaning: string;
  source: ShortcutSourceMetadata;
  confidence: MatchConfidence;
  rawTextStored: false;
};

export type ShortcutMap = {
  schemaVersion: typeof SCHEMA_VERSION;
  app: {
    bundleId: string;
    displayName: string;
    appVersion?: string;
  };
  shortcuts: ShortcutMapEntry[];
};

export type UnknownCandidate = {
  schemaVersion: typeof SCHEMA_VERSION;
  candidateId: string;
  bundleId: string;
  displayName: string;
  canonicalShortcut: string;
  appVersion?: string;
  observedAtBucket: string;
  source: Extract<SourceKind, 'unknown'>;
  rawTextStored: false;
};

export type UserOverride = {
  schemaVersion: typeof SCHEMA_VERSION;
  overrideId: string;
  bundleId: string;
  displayName: string;
  canonicalShortcut: string;
  meaning: string;
  source: Extract<SourceKind, 'user_override'>;
  updatedAtBucket: string;
  rawTextStored: false;
};

export type SourceConflict = {
  source: SourceKind;
  meaning: string;
  confidence: MatchConfidence;
};

export type MatchResult = {
  matched: boolean;
  bundleId: string;
  canonicalShortcut: string;
  meaning: string | null;
  source: SourceKind;
  confidence: MatchConfidence;
  conflicts: SourceConflict[];
  stale: boolean;
  staleReason?: string;
};

export type MigrationConflict = {
  id: string;
  reason: string;
};

export type MigrationDryRunResult = {
  beforeVersion: number;
  afterVersion: number;
  wouldMigrate: boolean;
  recordCount: number;
  conflicts: MigrationConflict[];
  destructive: false;
};

const SENSITIVE_KEYS = new Set(['rawText', 'rawKeyStream', 'password', 'imeText']);

export function coarseTimestampBucket(ms: number): string {
  if (!Number.isFinite(ms)) {
    throw new Error('timestamp must be a finite millisecond value');
  }
  return new Date(Math.floor(ms / TIMESTAMP_BUCKET_MS) * TIMESTAMP_BUCKET_MS).toISOString();
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableIdentity(parts: Array<string | undefined | null>): string {
  return parts.map((part) => part ?? '').join('\u001f');
}

export function createCandidateId(input: {
  bundleId: string;
  canonicalShortcut: string;
  appVersion?: string | null;
  observedAtMs: number;
}): string {
  const bucket = coarseTimestampBucket(input.observedAtMs);
  const identity = stableIdentity([input.bundleId, input.canonicalShortcut, input.appVersion, bucket]);
  return `uc_${stableHash(identity)}`;
}

export function createOverrideId(bundleId: string, canonicalShortcut: string): string {
  return `uo_${stableHash(stableIdentity([bundleId, canonicalShortcut]))}`;
}

export function isFreshActiveAppContext(context: ActiveAppContext, eventObservedAtMs: number): boolean {
  if (context.state !== 'resolved') return false;
  if (!context.bundleId?.trim() || !context.displayName?.trim()) return false;
  if (!Number.isFinite(context.observedAtMs) || !Number.isFinite(eventObservedAtMs)) return false;
  return Math.abs(eventObservedAtMs - context.observedAtMs) <= FRESHNESS_WINDOW_MS;
}

export function canStoreUnknownCandidate(context: ActiveAppContext, eventObservedAtMs: number): boolean {
  return isFreshActiveAppContext(context, eventObservedAtMs);
}

export function createUnknownCandidate(input: {
  context: ActiveAppContext;
  canonicalShortcut: string;
  eventObservedAtMs: number;
}): UnknownCandidate | null {
  if (!canStoreUnknownCandidate(input.context, input.eventObservedAtMs)) {
    return null;
  }

  const bundleId = input.context.bundleId as string;
  const displayName = input.context.displayName as string;

  return {
    schemaVersion: SCHEMA_VERSION,
    candidateId: createCandidateId({
      bundleId,
      canonicalShortcut: input.canonicalShortcut,
      appVersion: input.context.appVersion,
      observedAtMs: input.eventObservedAtMs,
    }),
    bundleId,
    displayName,
    canonicalShortcut: input.canonicalShortcut,
    ...(input.context.appVersion ? { appVersion: input.context.appVersion } : {}),
    observedAtBucket: coarseTimestampBucket(input.eventObservedAtMs),
    source: 'unknown',
    rawTextStored: false,
  };
}

export function createUserOverride(input: {
  bundleId: string;
  displayName: string;
  canonicalShortcut: string;
  meaning: string;
  updatedAtMs: number;
}): UserOverride {
  return {
    schemaVersion: SCHEMA_VERSION,
    overrideId: createOverrideId(input.bundleId, input.canonicalShortcut),
    bundleId: input.bundleId,
    displayName: input.displayName,
    canonicalShortcut: input.canonicalShortcut,
    meaning: input.meaning,
    source: 'user_override',
    updatedAtBucket: coarseTimestampBucket(input.updatedAtMs),
    rawTextStored: false,
  };
}

export function containsSensitiveKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) return true;
    if (containsSensitiveKeys(child)) return true;
  }
  return false;
}

export function assertNoSensitiveKeys(value: unknown): void {
  if (containsSensitiveKeys(value)) {
    throw new Error('record contains a sensitive raw input key');
  }
}

export function migrationDryRun(records: Array<{ id?: string; schemaVersion?: number }>, beforeVersion: number, afterVersion: number): MigrationDryRunResult {
  const conflicts = records
    .filter((record) => record.schemaVersion !== undefined && record.schemaVersion !== beforeVersion)
    .map((record, index) => ({
      id: record.id ?? `record-${index}`,
      reason: `expected schemaVersion ${beforeVersion}, found ${record.schemaVersion}`,
    }));

  return {
    beforeVersion,
    afterVersion,
    wouldMigrate: beforeVersion !== afterVersion && records.length > 0,
    recordCount: records.length,
    conflicts,
    destructive: false,
  };
}
