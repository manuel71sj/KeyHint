import { invoke } from '@tauri-apps/api/core';
import { escapeHtml } from './keyhint/htmlEscape';
import { createMockHudState, type MockHudMode, type MockHudState } from './keyhint/mockHud';
import { getSettingsSection, settingsDirection, settingsSections, type SettingsSection } from './keyhint/settingsIa';
import './styles.css';

type KeyHintStatus = {
  appName: string;
  localOnly: boolean;
  inputMonitoring: 'not_determined' | 'denied' | 'granted' | 'needs_restart';
  mockHudAvailable: boolean;
};

const fallbackStatus: KeyHintStatus = {
  appName: 'KeyHint for Mac',
  localOnly: true,
  inputMonitoring: 'not_determined',
  mockHudAvailable: true,
};

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Missing #app root');
}

const root: HTMLDivElement = appRoot;

async function loadStatus(): Promise<KeyHintStatus> {
  try {
    return await invoke<KeyHintStatus>('app_status');
  } catch {
    return fallbackStatus;
  }
}

function readMockHudState(): MockHudState {
  const params = new URLSearchParams(window.location.search);
  return createMockHudState({
    mode: params.get('mock'),
    shortcut: params.get('shortcut'),
    app: params.get('app'),
    meaning: params.get('meaning'),
    source: params.get('source'),
  });
}

function demoHref(mode: MockHudMode, params: Record<string, string> = {}) {
  const search = new URLSearchParams({ mock: mode, ...params });
  return `?${search.toString()}`;
}

function renderHud(state: MockHudState) {
  return `
    <div class="hud hud--${escapeHtml(state.mode)}" role="status" aria-live="polite" data-mock-hud="${escapeHtml(state.mode)}">
      <strong>${escapeHtml(state.headline)}</strong>
      <kbd>${escapeHtml(state.shortcut)}</kbd>
      <span>${escapeHtml(state.meta)}</span>
    </div>
  `;
}

function readView(): 'home' | 'settings' {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'settings' ? 'settings' : 'home';
}

function renderSettingsSection(section: SettingsSection) {
  const proof = section.proofPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
  return `
    <article class="settings-panel settings-panel--${escapeHtml(section.statusTone)}">
      <p class="panel-kicker">${escapeHtml(section.label)}</p>
      <h2>${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.intent)}</p>
      <div class="task-strip"><span>User task</span><strong>${escapeHtml(section.userTask)}</strong></div>
      <div class="task-strip"><span>Primary action</span><strong>${escapeHtml(section.primaryAction)}</strong></div>
      <ul>${proof}</ul>
    </article>
  `;
}

function settingsHref(id: string) {
  const search = new URLSearchParams({ view: 'settings', section: id });
  return `?${search.toString()}`;
}

function renderSettings() {
  const params = new URLSearchParams(window.location.search);
  const active = getSettingsSection(params.get('section'));
  const nav = settingsSections
    .map((section, index) => `<a class="rail-step ${section.id === active.id ? 'rail-step--active' : ''}" href="${settingsHref(section.id)}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(section.label)}</a>`)
    .join('');
  const defaults = settingsDirection.rejectedDefaults
    .map((item) => `<li><span>${escapeHtml(item.default)}</span><strong>${escapeHtml(item.replacement)}</strong></li>`)
    .join('');

  root.innerHTML = `
    <section class="settings-shell" aria-labelledby="settings-title">
      <div class="settings-hero">
        <p class="eyebrow">KeyHint Settings IA</p>
        <h1 id="settings-title">Keystroke ledger, not shortcut dictionary</h1>
        <p class="lede">${escapeHtml(settingsDirection.signature)}</p>
        <a class="home-link" href="?mock=known">Back to HUD preview</a>
      </div>

      <div class="settings-grid">
        <nav class="settings-rail" aria-label="Settings sections">${nav}</nav>
        ${renderSettingsSection(active)}
        <aside class="signature-card" aria-labelledby="signature-title">
          <p class="panel-kicker">Signature</p>
          <h2 id="signature-title">Capture → Context → Meaning → Memory</h2>
          <ul>${defaults}</ul>
        </aside>
      </div>
    </section>
  `;
}

function renderHome(status: KeyHintStatus, hud: MockHudState) {
  root.innerHTML = `
    <section class="shell" aria-labelledby="title">
      <p class="eyebrow">Local Mac shortcut memory layer</p>
      <h1 id="title">KeyHint for Mac</h1>
      <p class="lede">방금 누른 단축키를 현재 앱 기준으로 해석하는 meaning-first HUD.</p>

      ${renderHud(hud)}

      <nav class="demo-switcher" aria-label="Mock HUD states">
        <a href="${demoHref('known', { shortcut: 'Command+P', app: 'Cursor', meaning: 'Go to File', source: 'imported keybindings' })}">Known</a>
        <a href="${demoHref('unknown', { shortcut: 'Command+Shift+X', app: 'Cursor' })}">Unknown</a>
        <a href="${demoHref('permission')}">Permission missing</a>
        <a href="?view=settings">Settings IA</a>
      </nav>

      <dl class="status-grid">
        <div><dt>Local only</dt><dd>${escapeHtml(status.localOnly ? 'Yes' : 'No')}</dd></div>
        <div><dt>Input Monitoring</dt><dd>${escapeHtml(status.inputMonitoring)}</dd></div>
        <div><dt>Mock HUD</dt><dd>${escapeHtml(status.mockHudAvailable ? 'Available' : 'Unavailable')}</dd></div>
      </dl>

      <section class="contract" aria-labelledby="contract-title">
        <h2 id="contract-title">Permissionless preview contract</h2>
        <ul>
          <li>Input Monitoring 권한 없이 query string만으로 Known/Unknown/Permission HUD를 볼 수 있다.</li>
          <li>HUD 첫 줄은 의미 또는 회복 가능한 상태다.</li>
          <li>Unknown 상태는 로컬 Unknowns 저장과 raw text 미저장을 명시한다.</li>
          <li>Permission 상태는 System Settings 이동 전 신뢰 정보를 먼저 보여준다.</li>
        </ul>
      </section>
    </section>
  `;
}

loadStatus()
  .then((status) => {
    if (readView() === 'settings') {
      renderSettings();
      return;
    }
    renderHome(status, readMockHudState());
  })
  .catch(() => {
    if (readView() === 'settings') {
      renderSettings();
      return;
    }
    renderHome(fallbackStatus, readMockHudState());
  });
