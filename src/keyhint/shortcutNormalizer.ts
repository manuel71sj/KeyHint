export const MODIFIER_ORDER = ['Command', 'Control', 'Option', 'Shift', 'Fn'] as const;
export type CanonicalModifier = (typeof MODIFIER_ORDER)[number];

const MODIFIER_ALIASES: Record<string, CanonicalModifier> = {
  command: 'Command',
  cmd: 'Command',
  meta: 'Command',
  '⌘': 'Command',
  control: 'Control',
  ctrl: 'Control',
  '⌃': 'Control',
  option: 'Option',
  opt: 'Option',
  alt: 'Option',
  '⌥': 'Option',
  shift: 'Shift',
  '⇧': 'Shift',
  fn: 'Fn',
};

export type NormalizedShortcut = {
  canonical: string;
  modifiers: CanonicalModifier[];
  key: string;
  isModifierOnly: boolean;
};

export function normalizeCanonicalShortcut(input: string): NormalizedShortcut {
  const parts = input
    .replace(/[＋]/g, '+')
    .split(/[+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const modifiers = new Set<CanonicalModifier>();
  const keys: string[] = [];

  for (const part of parts) {
    const alias = MODIFIER_ALIASES[part.toLowerCase()] ?? MODIFIER_ALIASES[part];
    if (alias) {
      modifiers.add(alias);
      continue;
    }
    keys.push(canonicalKey(part));
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  const key = keys.join('+');
  const canonical = [...orderedModifiers, key].filter(Boolean).join('+');

  return {
    canonical,
    modifiers: orderedModifiers,
    key,
    isModifierOnly: orderedModifiers.length > 0 && key.length === 0,
  };
}

export function isShortcutCaptureCandidate(input: string): boolean {
  const normalized = normalizeCanonicalShortcut(input);
  return normalized.modifiers.length > 0 && !normalized.isModifierOnly && normalized.key.length > 0;
}

function canonicalKey(part: string): string {
  if (part.length === 1) return part.toUpperCase();
  return part.charAt(0).toUpperCase() + part.slice(1);
}
