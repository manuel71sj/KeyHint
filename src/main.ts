import { invoke } from '@tauri-apps/api/core';
import { createMockHudState, type MockHudMode, type MockHudState } from './keyhint/mockHud';
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
    <div class="hud hud--${state.mode}" role="status" aria-live="polite" data-mock-hud="${state.mode}">
      <strong>${state.headline}</strong>
      <kbd>${state.shortcut}</kbd>
      <span>${state.meta}</span>
    </div>
  `;
}

function render(status: KeyHintStatus, hud: MockHudState) {
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
      </nav>

      <dl class="status-grid">
        <div><dt>Local only</dt><dd>${status.localOnly ? 'Yes' : 'No'}</dd></div>
        <div><dt>Input Monitoring</dt><dd>${status.inputMonitoring}</dd></div>
        <div><dt>Mock HUD</dt><dd>${status.mockHudAvailable ? 'Available' : 'Unavailable'}</dd></div>
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
  .then((status) => render(status, readMockHudState()))
  .catch(() => render(fallbackStatus, readMockHudState()));
