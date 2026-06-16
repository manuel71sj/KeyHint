import { invoke } from '@tauri-apps/api/core';
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

function render(status: KeyHintStatus) {
  root.innerHTML = `
    <section class="shell" aria-labelledby="title">
      <p class="eyebrow">Local Mac shortcut memory layer</p>
      <h1 id="title">KeyHint for Mac</h1>
      <p class="lede">방금 누른 단축키를 현재 앱 기준으로 해석하는 meaning-first HUD.</p>

      <div class="hud" role="status" aria-live="polite">
        <strong>Go to File</strong>
        <kbd>⌘ P</kbd>
        <span>Cursor · Verified · Source: imported keybindings</span>
      </div>

      <dl class="status-grid">
        <div><dt>Local only</dt><dd>${status.localOnly ? 'Yes' : 'No'}</dd></div>
        <div><dt>Input Monitoring</dt><dd>${status.inputMonitoring}</dd></div>
        <div><dt>Mock HUD</dt><dd>${status.mockHudAvailable ? 'Available' : 'Unavailable'}</dd></div>
      </dl>

      <p class="note">Input Monitoring 권한 없이도 mock HUD preview를 먼저 확인하는 계약으로 시작합니다.</p>
    </section>
  `;
}

loadStatus().then(render).catch(() => render(fallbackStatus));
