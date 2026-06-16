export type SettingsSectionId = 'status' | 'privacy' | 'hud' | 'sources' | 'unknowns' | 'apps' | 'diagnostics';

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  title: string;
  intent: string;
  userTask: string;
  primaryAction: string;
  proofPoints: string[];
  statusTone: 'ready' | 'needs_setup' | 'watch';
};

export type InterfaceDirection = {
  domain: string[];
  colorWorld: string[];
  signature: string;
  rejectedDefaults: Array<{ default: string; replacement: string }>;
  tokens: {
    ink: string;
    graphite: string;
    keycap: string;
    phosphor: string;
    amber: string;
  };
};

export const settingsDirection: InterfaceDirection = {
  domain: [
    'keystroke ledger',
    'foreground app context',
    'source precedence ladder',
    'local memory vault',
    'Unknown recovery queue',
    'permission trust checklist',
  ],
  colorWorld: [
    'graphite aluminum keyboard deck',
    'warm keycap legends',
    'phosphor HUD glow',
    'amber unresolved warning light',
    'blue privacy pane tint',
    'dim terminal glass',
  ],
  signature: 'A capture-to-meaning rail that shows each shortcut moving from input context to source resolution to local memory.',
  rejectedDefaults: [
    { default: 'generic settings sidebar', replacement: 'trust sequence rail ordered by the shortcut lifecycle' },
    { default: 'flat preference toggles', replacement: 'proof cards that explain what KeyHint can verify locally' },
    { default: 'table-first shortcut dictionary', replacement: 'Unknown recovery queue and source precedence ladder' },
  ],
  tokens: {
    ink: '#f5f7fb',
    graphite: '#11151d',
    keycap: '#202634',
    phosphor: '#8fb3ff',
    amber: '#f6b44b',
  },
};

export const settingsSections: SettingsSection[] = [
  {
    id: 'status',
    label: 'Status',
    title: 'Trust before capture',
    intent: '사용자가 권한을 주기 전에 KeyHint가 무엇을 보관하지 않는지 확인한다.',
    userTask: '현재 앱/권한/로컬 store 상태를 한눈에 확인한다.',
    primaryAction: 'Run keyhint doctor',
    proofPoints: ['Local only', 'Network disabled by default', 'No raw text stored'],
    statusTone: 'ready',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'What never enters memory',
    intent: 'raw text, password, IME composing text가 저장되지 않음을 제품 안에서 설명한다.',
    userTask: '민감한 입력이 저장 대상이 아님을 검토한다.',
    primaryAction: 'Open privacy contract',
    proofPoints: ['rawText redacted', 'rawKeyStream redacted', 'coarse timestamp only'],
    statusTone: 'ready',
  },
  {
    id: 'hud',
    label: 'HUD',
    title: 'Meaning-first overlay',
    intent: 'HUD가 키 표시보다 의미/앱/출처를 먼저 보여주도록 조정한다.',
    userTask: '위치, 지속 시간, Unknown 표시 방식을 미리 본다.',
    primaryAction: 'Preview mock HUD',
    proofPoints: ['Known state', 'Unknown state', 'Permission missing state'],
    statusTone: 'ready',
  },
  {
    id: 'sources',
    label: 'Sources',
    title: 'Source precedence ladder',
    intent: '사용자가 왜 이 의미가 선택됐는지 source conflict까지 이해한다.',
    userTask: '앱별 import/seed/system/source 충돌을 확인한다.',
    primaryAction: 'Validate shortcut maps',
    proofPoints: ['User override wins', 'Imported keybindings next', 'Seed/system are fallback only'],
    statusTone: 'watch',
  },
  {
    id: 'unknowns',
    label: 'Unknowns',
    title: 'Recover the shortcuts KeyHint missed',
    intent: '방금 누른 실제 shortcut을 사용자가 라벨링하고 override로 승격한다.',
    userTask: '새 Unknown을 라벨, 무시, import한다.',
    primaryAction: 'Review Unknown inbox',
    proofPoints: ['Fresh active app only', 'Duplicate candidate coalescing', 'Import creates UserOverride'],
    statusTone: 'needs_setup',
  },
  {
    id: 'apps',
    label: 'Apps',
    title: 'Per-app memory health',
    intent: 'Cursor, Xcode, Terminal 같은 앱별 학습 상태와 source coverage를 보여준다.',
    userTask: '어떤 앱의 shortcut memory가 비어 있거나 충돌 중인지 찾는다.',
    primaryAction: 'Inspect app coverage',
    proofPoints: ['Bundle id', 'App version', 'Map version'],
    statusTone: 'watch',
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    title: 'Export only what is safe',
    intent: '문제 해결에 필요한 정보만 redaction 후 내보낸다.',
    userTask: '지원 요청 전에 안전한 diagnostics를 생성한다.',
    primaryAction: 'Generate redacted diagnostics',
    proofPoints: ['No raw text', 'No raw key stream', 'Queue and permission summary only'],
    statusTone: 'ready',
  },
];

export function getSettingsSection(id: string | null): SettingsSection {
  return settingsSections.find((section) => section.id === id) ?? settingsSections[0];
}

export function settingsCompletionChecks(): string[] {
  return [
    'Status/Privacy/HUD/Sources/Unknowns/Apps/Diagnostics sections exist',
    'Each section has a user task, primary action, and proof points',
    'Signature rail describes capture-to-meaning-to-memory lifecycle',
    'Design avoids generic dictionary/table-first defaults',
  ];
}
