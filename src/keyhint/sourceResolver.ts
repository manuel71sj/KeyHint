import {
  SOURCE_PRECEDENCE,
  SCHEMA_VERSION,
  createUnknownCandidate,
  type ActiveAppContext,
  type MatchConfidence,
  type MatchResult,
  type ShortcutMapEntry,
  type SourceKind,
  type UnknownCandidate,
} from './localStoreSchema.ts';

export type ShortcutCandidate = {
  bundleId: string;
  canonicalShortcut: string;
  meaning: string;
  source: SourceKind;
  confidence?: MatchConfidence;
  appVersion?: string;
  mapVersion?: string;
  stale?: boolean;
  staleReason?: string;
  rawTextStored: false;
};

export type ResolveShortcutInput = {
  bundleId: string;
  canonicalShortcut: string;
  candidates: ShortcutCandidate[];
};

export type UnknownCandidateInput = {
  context: ActiveAppContext;
  canonicalShortcut: string;
  eventObservedAtMs: number;
};

const CONFIDENCE_BY_SOURCE: Record<SourceKind, MatchConfidence> = {
  user_override: 'user_verified',
  imported_keybindings: 'imported',
  menu_introspection: 'menu',
  official_app_source: 'official',
  seed_map: 'seed',
  system_map: 'system',
  unknown: 'unknown',
};

function sourceRank(source: SourceKind): number {
  const rank = SOURCE_PRECEDENCE.indexOf(source);
  return rank === -1 ? SOURCE_PRECEDENCE.length : rank;
}

export function normalizeSourceKind(source: string): SourceKind {
  if (source === 'imported') return 'imported_keybindings';
  if (source === 'seed') return 'seed_map';
  if ((SOURCE_PRECEDENCE as readonly string[]).includes(source)) {
    return source as SourceKind;
  }
  return 'unknown';
}

export function normalizeMapEntry(bundleId: string, entry: ShortcutMapEntry): ShortcutCandidate {
  return {
    bundleId,
    canonicalShortcut: entry.canonicalShortcut,
    meaning: entry.meaning,
    source: entry.source.kind,
    confidence: entry.confidence,
    rawTextStored: false,
  };
}

export function resolveShortcut(input: ResolveShortcutInput): MatchResult {
  const matching = input.candidates.filter(
    (candidate) => candidate.bundleId === input.bundleId && candidate.canonicalShortcut === input.canonicalShortcut,
  );

  if (matching.length === 0) {
    return {
      matched: false,
      bundleId: input.bundleId,
      canonicalShortcut: input.canonicalShortcut,
      meaning: null,
      source: 'unknown',
      confidence: 'unknown',
      conflicts: [],
      stale: false,
    };
  }

  const sorted = [...matching].sort((left, right) => sourceRank(left.source) - sourceRank(right.source));
  const winner = sorted[0];
  const conflicts = sorted.slice(1).map((candidate) => ({
    source: candidate.source,
    meaning: candidate.meaning,
    confidence: candidate.confidence ?? CONFIDENCE_BY_SOURCE[candidate.source],
  }));

  return {
    matched: winner.source !== 'unknown',
    bundleId: input.bundleId,
    canonicalShortcut: input.canonicalShortcut,
    meaning: winner.meaning,
    source: winner.source,
    confidence: winner.confidence ?? CONFIDENCE_BY_SOURCE[winner.source],
    conflicts,
    stale: Boolean(winner.stale),
    ...(winner.staleReason ? { staleReason: winner.staleReason } : {}),
  };
}

export function createResolverUnknownCandidate(input: UnknownCandidateInput): UnknownCandidate | null {
  return createUnknownCandidate(input);
}

export function sourceResolverContract() {
  return {
    schemaVersion: SCHEMA_VERSION,
    sourcePrecedence: [...SOURCE_PRECEDENCE],
    unresolvedContextStoresUnknown: false,
    rawTextStored: false,
  };
}
