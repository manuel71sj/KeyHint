import { isShortcutCaptureCandidate, normalizeCanonicalShortcut } from './shortcutNormalizer.ts';

export type ShortcutQueueEvent = {
  canonicalShortcut: string;
  observedAtMs: number;
  rawTextStored: false;
};

export type ShortcutQueueState = {
  events: ShortcutQueueEvent[];
  dropped: number;
  coalesced: number;
  paused: boolean;
};

export function createShortcutQueue(): ShortcutQueueState {
  return { events: [], dropped: 0, coalesced: 0, paused: false };
}

export function enqueueShortcutEvent(
  state: ShortcutQueueState,
  input: { shortcut: string; observedAtMs: number; sensitiveContext?: boolean },
  options: { maxDepth: number },
): ShortcutQueueState {
  if (input.sensitiveContext) {
    return { ...state, paused: true };
  }
  if (!isShortcutCaptureCandidate(input.shortcut)) {
    return { ...state, dropped: state.dropped + 1 };
  }

  const canonicalShortcut = normalizeCanonicalShortcut(input.shortcut).canonical;
  const last = state.events[state.events.length - 1];
  if (last?.canonicalShortcut === canonicalShortcut && input.observedAtMs - last.observedAtMs <= 80) {
    return {
      ...state,
      coalesced: state.coalesced + 1,
      events: [...state.events.slice(0, -1), { ...last, observedAtMs: input.observedAtMs }],
    };
  }

  const nextEvent: ShortcutQueueEvent = { canonicalShortcut, observedAtMs: input.observedAtMs, rawTextStored: false };
  const nextEvents: ShortcutQueueEvent[] = [...state.events, nextEvent];
  if (nextEvents.length <= options.maxDepth) {
    return { ...state, events: nextEvents };
  }

  return {
    ...state,
    events: nextEvents.slice(nextEvents.length - options.maxDepth),
    dropped: state.dropped + 1,
  };
}
