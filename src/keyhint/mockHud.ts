export type MockHudMode = 'known' | 'unknown' | 'permission';

export type MockHudState = {
  mode: MockHudMode;
  headline: string;
  shortcut: string;
  appName: string;
  meta: string;
  source: 'imported' | 'unknown' | 'permission';
  confidenceLabel: 'Verified' | 'Saved to Unknowns' | 'Needs permission';
  storesRawText: false;
};

export type MockHudInput = {
  mode?: string | null;
  shortcut?: string | null;
  app?: string | null;
  meaning?: string | null;
  source?: string | null;
};

const MODIFIER_SYMBOLS: Record<string, string> = {
  command: '⌘',
  cmd: '⌘',
  meta: '⌘',
  shift: '⇧',
  option: '⌥',
  alt: '⌥',
  control: '⌃',
  ctrl: '⌃',
  fn: 'fn',
};

export function normalizeShortcut(input = 'Command+P'): string {
  return input
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => MODIFIER_SYMBOLS[part.toLowerCase()] ?? part.toUpperCase())
    .join(' ');
}

export function coerceMockHudMode(mode?: string | null): MockHudMode {
  if (mode === 'unknown' || mode === 'permission') {
    return mode;
  }
  return 'known';
}

export function createMockHudState(input: MockHudInput = {}): MockHudState {
  const mode = coerceMockHudMode(input.mode);
  const shortcut = normalizeShortcut(input.shortcut ?? (mode === 'unknown' ? 'Command+Shift+X' : 'Command+P'));
  const appName = input.app?.trim() || 'Cursor';

  if (mode === 'permission') {
    return {
      mode,
      headline: 'KeyHint cannot see shortcuts yet',
      shortcut: 'Input Monitoring is disabled',
      appName: 'macOS Privacy & Security',
      meta: 'Open System Settings · Local only · No raw text stored',
      source: 'permission',
      confidenceLabel: 'Needs permission',
      storesRawText: false,
    };
  }

  if (mode === 'unknown') {
    return {
      mode,
      headline: `Not learned yet${appName ? ` in ${appName}` : ''}`,
      shortcut,
      appName,
      meta: `${appName} · Saved to Unknowns · No raw text stored`,
      source: 'unknown',
      confidenceLabel: 'Saved to Unknowns',
      storesRawText: false,
    };
  }

  const source = input.source?.trim() || 'imported keybindings';

  return {
    mode,
    headline: input.meaning?.trim() || 'Go to File',
    shortcut,
    appName,
    meta: `${appName} · Verified · Source: ${source}`,
    source: 'imported',
    confidenceLabel: 'Verified',
    storesRawText: false,
  };
}
