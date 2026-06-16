#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const command = args.shift() ?? 'help';

const MODIFIER_SYMBOLS = {
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

function normalizeShortcut(input = 'Command+P') {
  return input
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => MODIFIER_SYMBOLS[part.toLowerCase()] ?? part.toUpperCase())
    .join(' ');
}

function readFlag(name, fallback = undefined) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const next = args[index + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function safeVersion(binary, versionArgs = ['--version']) {
  try {
    return execFileSync(binary, versionArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unavailable';
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function help() {
  process.stdout.write(`KeyHint developer commands\n\nUsage:\n  npm run keyhint -- doctor\n  npm run keyhint -- hud:test --shortcut Command+P --app Cursor\n  npm run keyhint -- permissions:check\n  npm run keyhint -- maps:validate\n  npm run keyhint -- diagnostics:redact [--out .tmp/diagnostics-redacted.json]\n  npm run keyhint -- event:spike\n  npm run keyhint -- app:resolve\n  npm run keyhint -- renderer:matrix\n  npm run keyhint -- unknown:add --bundle-id com.todesktop.230313mzl4w4u92 --app Cursor --shortcut Command+Shift+X\n  npm run keyhint -- unknown:list\n  npm run keyhint -- unknown:label --id uc_xxxxxxxx --meaning \"Run selected command\"\n  npm run keyhint -- unknown:ignore --id uc_xxxxxxxx\n  npm run keyhint -- unknown:import --id uc_xxxxxxxx\n\n`);
}

function doctor() {
  printJson({
    ok: true,
    app: 'KeyHint for Mac',
    localOnly: true,
    storesRawText: false,
    networkDefault: 'disabled',
    platform: process.platform,
    node: safeVersion('node'),
    npm: safeVersion('npm'),
    cargo: safeVersion('cargo'),
    rustc: safeVersion('rustc'),
    checks: {
      packageJson: existsSync(join(root, 'package.json')),
      tauriConfig: existsSync(join(root, 'src-tauri', 'tauri.conf.json')),
      shortcutMaps: existsSync(join(root, 'data', 'shortcut-maps')),
      mockHud: existsSync(join(root, 'src', 'keyhint', 'mockHud.ts')),
    },
  });
}

function hudTest() {
  const permission = readFlag('permission');
  const unknown = hasFlag('unknown');
  const shortcut = String(readFlag('shortcut', unknown ? 'Command+Shift+X' : 'Command+P'));
  const app = String(readFlag('app', 'Cursor'));
  const meaning = String(readFlag('meaning', 'Go to File'));
  const source = String(readFlag('source', 'imported keybindings'));

  if (permission === 'denied' || permission === true) {
    process.stdout.write('KeyHint cannot see shortcuts yet\nInput Monitoring is disabled\nOpen System Settings\n');
    return;
  }

  if (unknown) {
    process.stdout.write(`Not learned yet in ${app}\n${normalizeShortcut(shortcut)}\n${app} · Saved to Unknowns · No raw text stored\n`);
    return;
  }

  process.stdout.write(`${meaning}\n${normalizeShortcut(shortcut)}\n${app} · Verified · Source: ${source}\n`);
}

function permissionsCheck() {
  printJson({
    ok: true,
    inputMonitoring: 'manual_check_required',
    collectorStarted: false,
    reason: 'Stage 5 command surface does not request macOS permissions.',
    fix: 'System Settings -> Privacy & Security -> Input Monitoring -> KeyHint for Mac',
    docs: 'docs/troubleshooting.md#input-monitoring',
  });
}

function validateShortcutMap(mapPath) {
  const parsed = JSON.parse(readFileSync(mapPath, 'utf8'));
  const errors = [];
  if (parsed.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!parsed.app?.bundleId) errors.push('app.bundleId is required');
  if (!parsed.app?.displayName) errors.push('app.displayName is required');
  if (!Array.isArray(parsed.shortcuts)) errors.push('shortcuts must be an array');
  for (const [index, shortcut] of (parsed.shortcuts ?? []).entries()) {
    if (!shortcut.shortcut) errors.push(`shortcuts[${index}].shortcut is required`);
    if (!shortcut.meaning) errors.push(`shortcuts[${index}].meaning is required`);
    if (shortcut.rawTextStored !== false) errors.push(`shortcuts[${index}].rawTextStored must be false`);
  }
  return { file: mapPath, ok: errors.length === 0, errors };
}

function mapsValidate() {
  const dir = join(root, 'data', 'shortcut-maps');
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.json')) : [];
  const results = files.map((name) => validateShortcutMap(join(dir, name)));
  const ok = results.length > 0 && results.every((result) => result.ok);
  printJson({ ok, checked: results.length, results });
  if (!ok) process.exitCode = 1;
}

function rendererMatrix() {
  printJson({
    ok: true,
    interfaceContract: 'HudRenderer.show(state) must be non-interactive, focus-safe, and replace in-flight HUD state.',
    focusPolicy: 'HUD must never steal keyboard focus; Settings owns editing and correction.',
    defaultPosition: 'active display bottom-center above Dock/safe area',
    maxWidthPx: 520,
    capabilities: [
      { scenario: 'standard_desktop', primary: 'tauri_window', fallback: 'native_panel_fallback', requiresManualCheck: false },
      { scenario: 'fullscreen_spaces', primary: 'native_panel_fallback', fallback: 'tauri_window', requiresManualCheck: true },
      { scenario: 'stage_manager', primary: 'native_panel_fallback', fallback: 'tauri_window', requiresManualCheck: true },
      { scenario: 'multi_display', primary: 'tauri_window', fallback: 'native_panel_fallback', requiresManualCheck: true },
      { scenario: 'remote_desktop', primary: 'native_panel_fallback', fallback: null, requiresManualCheck: true },
      { scenario: 'reduced_motion', primary: 'tauri_window', fallback: 'native_panel_fallback', requiresManualCheck: false },
    ],
  });
}

function resolveActiveApp() {
  const observedAt = Date.now();
  const script = [
    'tell application "System Events"',
    'set frontApp to first application process whose frontmost is true',
    'set appName to name of frontApp',
    'set bundleId to bundle identifier of frontApp',
    'return appName & "\n" & bundleId',
    'end tell',
  ].join('\n');

  try {
    const output = execFileSync('osascript', ['-e', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const [displayName, bundleId] = output.split(/\r?\n/);
    const resolved = Boolean(displayName && bundleId);
    printJson({
      ok: true,
      state: resolved ? 'resolved' : 'no_active_app',
      bundleId: bundleId || null,
      displayName: displayName || null,
      observedAtMs: observedAt,
      canStoreUnknown: resolved,
      storageGuard: 'store UnknownCandidate only when state is resolved and context is fresh',
    });
  } catch (error) {
    printJson({
      ok: true,
      state: 'resolver_unavailable',
      bundleId: null,
      displayName: null,
      observedAtMs: observedAt,
      canStoreUnknown: false,
      storageGuard: 'do not store UnknownCandidate when resolver is unavailable',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function eventSpike() {
  printJson({
    ok: true,
    permissionState: 'not_determined',
    supportedPermissionStates: ['not_determined', 'denied', 'granted', 'revoked_during_run', 'needs_restart'],
    collectorStarted: false,
    eventTapStrategy: 'CGEventTap listen-only spike; do not start without explicit permission flow',
    callbackContract: 'enqueue sanitized compact event only; no matching, UI rendering, storage, or network in callback',
    secureInputPolicy: 'pause and do not enqueue while Secure Event Input is active or suspected',
    imePolicy: 'ignore IME composing/dead-key/plain-text candidates',
    plainTextPolicy: 'ignore modifier-less typing and never persist raw text/raw key stream',
    storesRawText: false,
    manualChecks: [
      'Input Monitoring grant/revoke/relaunch',
      'Secure Event Input suppression',
      'IME composing and dead key suppression',
      'password field suppression',
      '10x shortcut burst queue behavior',
    ],
  });
}


const SCHEMA_VERSION = 1;
const TIMESTAMP_BUCKET_MS = 60 * 60 * 1000;
const UNKNOWN_STORE_PATH = process.env.KEYHINT_STORE_PATH || join(root, '.keyhint', 'unknown-inbox.json');

function coarseTimestampBucket(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) throw new Error('timestamp must be finite');
  return new Date(Math.floor(value / TIMESTAMP_BUCKET_MS) * TIMESTAMP_BUCKET_MS).toISOString();
}

function stableHash(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableIdentity(parts) {
  return parts.map((part) => part ?? '').join('\u001f');
}

function createCandidateId({ bundleId, canonicalShortcut, appVersion, observedAtMs }) {
  return `uc_${stableHash(stableIdentity([bundleId, canonicalShortcut, appVersion, coarseTimestampBucket(observedAtMs)]))}`;
}

function createOverrideId(bundleId, canonicalShortcut) {
  return `uo_${stableHash(stableIdentity([bundleId, canonicalShortcut]))}`;
}

function readUnknownStore() {
  if (!existsSync(UNKNOWN_STORE_PATH)) {
    return { schemaVersion: SCHEMA_VERSION, items: [] };
  }
  return JSON.parse(readFileSync(UNKNOWN_STORE_PATH, 'utf8'));
}

function writeUnknownStore(store) {
  mkdirSync(dirname(UNKNOWN_STORE_PATH), { recursive: true });
  writeFileSync(UNKNOWN_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`);
}

function sensitiveKeyExists(value) {
  if (!value || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'rawText' || key === 'rawKeyStream' || key === 'password' || key === 'imeText') return true;
    if (sensitiveKeyExists(child)) return true;
  }
  return false;
}

function assertNoSensitiveKeys(value) {
  if (sensitiveKeyExists(value)) throw new Error('record contains a sensitive raw input key');
}

function findUnknownItem(store, id) {
  const item = store.items.find((entry) => entry.candidate?.candidateId === id);
  if (!item) throw new Error(`UnknownCandidate not found: ${id}`);
  return item;
}

function replaceUnknownItem(store, item) {
  assertNoSensitiveKeys(item);
  return {
    ...store,
    items: store.items.map((entry) => (entry.candidate?.candidateId === item.candidate.candidateId ? item : entry)),
  };
}

function summarizeUnknownStore(store) {
  return {
    schemaVersion: store.schemaVersion,
    total: store.items.length,
    new: store.items.filter((item) => item.status === 'new').length,
    labeled: store.items.filter((item) => item.status === 'labeled').length,
    ignored: store.items.filter((item) => item.status === 'ignored').length,
    imported: store.items.filter((item) => item.status === 'imported').length,
    rawTextStored: false,
  };
}

function unknownAdd() {
  const bundleId = String(readFlag('bundle-id', '')).trim();
  const displayName = String(readFlag('app', '')).trim();
  const shortcut = String(readFlag('shortcut', '')).trim();
  const appVersion = readFlag('app-version');
  const observedAtMs = Number(readFlag('observed-at', Date.now()));

  if (!bundleId || !displayName || !shortcut) {
    throw new Error('unknown:add requires --bundle-id, --app, and --shortcut');
  }

  const candidate = {
    schemaVersion: SCHEMA_VERSION,
    candidateId: createCandidateId({ bundleId, canonicalShortcut: shortcut, appVersion: typeof appVersion === 'string' ? appVersion : undefined, observedAtMs }),
    bundleId,
    displayName,
    canonicalShortcut: shortcut,
    ...(typeof appVersion === 'string' ? { appVersion } : {}),
    observedAtBucket: coarseTimestampBucket(observedAtMs),
    source: 'unknown',
    rawTextStored: false,
  };
  assertNoSensitiveKeys(candidate);

  const store = readUnknownStore();
  const existing = store.items.find((item) => item.candidate?.candidateId === candidate.candidateId);
  const item = existing
    ? { ...existing, candidate, seenCount: existing.seenCount + 1 }
    : { schemaVersion: SCHEMA_VERSION, candidate, status: 'new', seenCount: 1, rawTextStored: false };
  const next = existing ? replaceUnknownItem(store, item) : { ...store, items: [...store.items, item] };
  writeUnknownStore(next);
  printJson({ ok: true, storePath: UNKNOWN_STORE_PATH, item, summary: summarizeUnknownStore(next) });
}

function unknownList() {
  const store = readUnknownStore();
  printJson({ ok: true, storePath: UNKNOWN_STORE_PATH, summary: summarizeUnknownStore(store), items: store.items });
}

function unknownLabel() {
  const id = String(readFlag('id', '')).trim();
  const meaning = String(readFlag('meaning', '')).trim();
  const at = Number(readFlag('at', Date.now()));
  if (!id || !meaning) throw new Error('unknown:label requires --id and --meaning');
  const store = readUnknownStore();
  const item = findUnknownItem(store, id);
  const nextItem = {
    ...item,
    status: 'labeled',
    label: { meaning, labeledAtBucket: coarseTimestampBucket(at) },
    ignoredAtBucket: undefined,
    importedAtBucket: undefined,
    overrideId: undefined,
  };
  const next = replaceUnknownItem(store, nextItem);
  writeUnknownStore(next);
  printJson({ ok: true, storePath: UNKNOWN_STORE_PATH, item: nextItem, summary: summarizeUnknownStore(next) });
}

function unknownIgnore() {
  const id = String(readFlag('id', '')).trim();
  const at = Number(readFlag('at', Date.now()));
  if (!id) throw new Error('unknown:ignore requires --id');
  const store = readUnknownStore();
  const item = findUnknownItem(store, id);
  const nextItem = { ...item, status: 'ignored', ignoredAtBucket: coarseTimestampBucket(at) };
  const next = replaceUnknownItem(store, nextItem);
  writeUnknownStore(next);
  printJson({ ok: true, storePath: UNKNOWN_STORE_PATH, item: nextItem, summary: summarizeUnknownStore(next) });
}

function unknownImport() {
  const id = String(readFlag('id', '')).trim();
  const at = Number(readFlag('at', Date.now()));
  if (!id) throw new Error('unknown:import requires --id');
  const store = readUnknownStore();
  const item = findUnknownItem(store, id);
  if (!item.label?.meaning) throw new Error('UnknownCandidate must be labeled before import');
  const override = {
    schemaVersion: SCHEMA_VERSION,
    overrideId: createOverrideId(item.candidate.bundleId, item.candidate.canonicalShortcut),
    bundleId: item.candidate.bundleId,
    displayName: item.candidate.displayName,
    canonicalShortcut: item.candidate.canonicalShortcut,
    meaning: item.label.meaning,
    source: 'user_override',
    updatedAtBucket: coarseTimestampBucket(at),
    rawTextStored: false,
  };
  const nextItem = { ...item, status: 'imported', importedAtBucket: coarseTimestampBucket(at), overrideId: override.overrideId };
  const next = replaceUnknownItem(store, nextItem);
  writeUnknownStore(next);
  printJson({ ok: true, storePath: UNKNOWN_STORE_PATH, item: nextItem, override, summary: summarizeUnknownStore(next) });
}

function diagnosticsRedact() {
  const out = readFlag('out');
  const diagnostics = {
    generatedAt: new Date().toISOString(),
    localOnly: true,
    rawText: '[REDACTED]',
    rawKeyStream: '[REDACTED]',
    activeApp: { bundleId: 'com.todesktop.230313mzl4w4u92', displayName: 'Cursor' },
    lastShortcut: 'Command+P',
    queue: { depth: 0, dropped: 0, coalesced: 0 },
    permissions: { inputMonitoring: 'manual_check_required' },
  };
  if (typeof out === 'string') {
    const target = join(root, out);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(diagnostics, null, 2));
    process.stdout.write(`${target}\n`);
    return;
  }
  printJson(diagnostics);
}

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  case 'doctor':
    doctor();
    break;
  case 'hud:test':
    hudTest();
    break;
  case 'permissions:check':
    permissionsCheck();
    break;
  case 'maps:validate':
    mapsValidate();
    break;
  case 'diagnostics:redact':
    diagnosticsRedact();
    break;
  case 'event:spike':
    eventSpike();
    break;
  case 'app:resolve':
    resolveActiveApp();
    break;
  case 'renderer:matrix':
    rendererMatrix();
    break;
  case 'unknown:add':
    unknownAdd();
    break;
  case 'unknown:list':
    unknownList();
    break;
  case 'unknown:label':
    unknownLabel();
    break;
  case 'unknown:ignore':
    unknownIgnore();
    break;
  case 'unknown:import':
    unknownImport();
    break;
  default:
    process.stderr.write(`Unknown keyhint command: ${command}\n\n`);
    help();
    process.exitCode = 2;
}
