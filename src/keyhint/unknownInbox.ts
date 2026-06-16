import {
  SCHEMA_VERSION,
  assertNoSensitiveKeys,
  coarseTimestampBucket,
  createUserOverride,
  type UnknownCandidate,
  type UserOverride,
} from './localStoreSchema.ts';

export type UnknownInboxStatus = 'new' | 'labeled' | 'ignored' | 'imported';

export type UnknownInboxItem = {
  schemaVersion: typeof SCHEMA_VERSION;
  candidate: UnknownCandidate;
  status: UnknownInboxStatus;
  seenCount: number;
  rawTextStored: false;
  label?: {
    meaning: string;
    labeledAtBucket: string;
  };
  ignoredAtBucket?: string;
  importedAtBucket?: string;
  overrideId?: string;
};

export type UnknownInboxState = {
  schemaVersion: typeof SCHEMA_VERSION;
  items: UnknownInboxItem[];
};

export type ImportUnknownResult = {
  state: UnknownInboxState;
  override: UserOverride;
};

export function createEmptyUnknownInbox(): UnknownInboxState {
  return { schemaVersion: SCHEMA_VERSION, items: [] };
}

export function addUnknownCandidate(state: UnknownInboxState, candidate: UnknownCandidate): UnknownInboxState {
  assertNoSensitiveKeys(candidate);
  const existing = state.items.find((item) => item.candidate.candidateId === candidate.candidateId);

  if (existing) {
    return replaceItem(state, {
      ...existing,
      candidate,
      seenCount: existing.seenCount + 1,
    });
  }

  return {
    ...state,
    items: [
      ...state.items,
      {
        schemaVersion: SCHEMA_VERSION,
        candidate,
        status: 'new',
        seenCount: 1,
        rawTextStored: false,
      },
    ],
  };
}

export function labelUnknownCandidate(state: UnknownInboxState, candidateId: string, meaning: string, labeledAtMs: number): UnknownInboxState {
  const item = requireItem(state, candidateId);
  const cleanMeaning = meaning.trim();
  if (!cleanMeaning) {
    throw new Error('meaning is required to label an UnknownCandidate');
  }

  return replaceItem(state, {
    ...item,
    status: 'labeled',
    label: {
      meaning: cleanMeaning,
      labeledAtBucket: coarseTimestampBucket(labeledAtMs),
    },
    ignoredAtBucket: undefined,
    importedAtBucket: undefined,
    overrideId: undefined,
  });
}

export function ignoreUnknownCandidate(state: UnknownInboxState, candidateId: string, ignoredAtMs: number): UnknownInboxState {
  const item = requireItem(state, candidateId);
  return replaceItem(state, {
    ...item,
    status: 'ignored',
    ignoredAtBucket: coarseTimestampBucket(ignoredAtMs),
  });
}

export function importLabeledUnknown(state: UnknownInboxState, candidateId: string, importedAtMs: number): ImportUnknownResult {
  const item = requireItem(state, candidateId);
  if (!item.label?.meaning) {
    throw new Error('UnknownCandidate must be labeled before import');
  }

  const override = createUserOverride({
    bundleId: item.candidate.bundleId,
    displayName: item.candidate.displayName,
    canonicalShortcut: item.candidate.canonicalShortcut,
    meaning: item.label.meaning,
    updatedAtMs: importedAtMs,
  });

  return {
    override,
    state: replaceItem(state, {
      ...item,
      status: 'imported',
      importedAtBucket: coarseTimestampBucket(importedAtMs),
      overrideId: override.overrideId,
    }),
  };
}

export function listActionableUnknowns(state: UnknownInboxState): UnknownInboxItem[] {
  return state.items.filter((item) => item.status === 'new' || item.status === 'labeled');
}

export function summarizeUnknownInbox(state: UnknownInboxState) {
  return {
    schemaVersion: state.schemaVersion,
    total: state.items.length,
    new: state.items.filter((item) => item.status === 'new').length,
    labeled: state.items.filter((item) => item.status === 'labeled').length,
    ignored: state.items.filter((item) => item.status === 'ignored').length,
    imported: state.items.filter((item) => item.status === 'imported').length,
    rawTextStored: false,
  };
}

function requireItem(state: UnknownInboxState, candidateId: string): UnknownInboxItem {
  const item = state.items.find((entry) => entry.candidate.candidateId === candidateId);
  if (!item) {
    throw new Error(`UnknownCandidate not found: ${candidateId}`);
  }
  return item;
}

function replaceItem(state: UnknownInboxState, item: UnknownInboxItem): UnknownInboxState {
  assertNoSensitiveKeys(item);
  return {
    ...state,
    items: state.items.map((entry) => (entry.candidate.candidateId === item.candidate.candidateId ? item : entry)),
  };
}
