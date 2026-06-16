# Shortcut Maps, Source Resolver, Local Store Schema

작성일: 2026-06-16  
범위: KeyHint 단계 9

KeyHint의 차별점은 “사전 목록”이 아니라 **방금 누른 실제 단축키의 앱별 의미를 즉시 해석**하는 것이다. 이 문서는 그 해석 레이어의 source precedence, local store schema, Unknown 회수 계약을 고정한다.

## Source precedence

동일 앱/동일 canonical shortcut에 여러 의미 후보가 있을 때 우선순위는 다음 순서를 따른다.

1. `user_override` — 사용자가 직접 고친 의미. 항상 최우선.
2. `imported_keybindings` — Cursor/VS Code 등 앱 설정에서 import한 개인 keybindings.
3. `menu_introspection` — 현재 앱 메뉴/명령 introspection에서 얻은 의미.
4. `official_app_source` — 공식 문서/배포된 앱 metadata.
5. `seed_map` — KeyHint가 제공하는 초기 shortcut map.
6. `system_map` — macOS/system-wide fallback.
7. `unknown` — 아직 의미를 모르는 후보.

Resolver는 winning source와 losing conflicts를 함께 반환해야 한다. HUD는 winning meaning을 보여주고, Settings는 conflict를 사용자가 고칠 수 있게 보여준다.

## Local-only store contract

모든 local record는 다음 원칙을 따른다.

- `schemaVersion`은 camelCase로 통일한다.
- `rawTextStored`는 항상 `false`다.
- `rawText`, `rawKeyStream`, `password`, `imeText` 키는 저장하지 않는다.
- 네트워크 전송은 기본적으로 없다.
- timestamp는 exact time 대신 1시간 coarse bucket만 저장한다.

## Core records

### `ShortcutMapEntry`

```ts
{
  canonicalShortcut: 'Command+P',
  meaning: 'Go to File',
  source: {
    kind: 'seed_map',
    version: '2026.06.16-alpha',
    rawTextStored: false
  },
  confidence: 'seed',
  rawTextStored: false
}
```

### `UnknownCandidate`

Unknown은 active app context가 신뢰 가능한 경우에만 저장한다.

```ts
{
  schemaVersion: 1,
  candidateId: 'uc_<stable-hash>',
  bundleId: 'com.todesktop.230313mzl4w4u92',
  displayName: 'Cursor',
  canonicalShortcut: 'Command+Shift+X',
  appVersion: '1.0.0',
  observedAtBucket: '2026-06-16T03:00:00.000Z',
  source: 'unknown',
  rawTextStored: false
}
```

`candidateId`는 `bundleId + canonicalShortcut + appVersion? + coarseTimestampBucket`에서 deterministic하게 만든다. unresolved/no_active_app/stale_context/resolver_unavailable 상태에서는 `candidateId`를 만들지 않고 Unknown도 저장하지 않는다.

### `UserOverride`

```ts
{
  schemaVersion: 1,
  overrideId: 'uo_<stable-hash>',
  bundleId: 'com.todesktop.230313mzl4w4u92',
  displayName: 'Cursor',
  canonicalShortcut: 'Command+P',
  meaning: 'Open file by name',
  source: 'user_override',
  updatedAtBucket: '2026-06-16T03:00:00.000Z',
  rawTextStored: false
}
```

`overrideId`는 `bundleId + canonicalShortcut`에서 deterministic하게 만든다. 같은 앱/shortcut override는 새 row가 아니라 기존 row를 갱신한다.

## Freshness guard

`FRESHNESS_WINDOW_MS = 250`.

- Rust active app guard가 authoritative source다.
- TypeScript resolver/local store는 Rust가 제공한 resolved/fresh context를 소비한다.
- TS helper는 테스트와 UI guard를 위해 같은 250ms 기준을 노출한다.
- `resolved`이고 bundle id/display name이 있고 event time과 context observed time 차이가 250ms 이내일 때만 Unknown 저장 가능하다.

## Migration dry-run

Stage 9 migration은 dry-run only다. 실제 데이터를 수정하지 않는다.

```ts
{
  beforeVersion: 1,
  afterVersion: 2,
  wouldMigrate: true,
  recordCount: 2,
  conflicts: [{ id: 'old-1', reason: 'expected schemaVersion 1, found 0' }],
  destructive: false
}
```

## Verification

```bash
npm run test:source-resolver
npm run test
npm run build
npm audit --audit-level=high
```

이 검증은 precedence, deterministic identity, Unknown freshness guard, dry-run shape, redaction negative assertion을 포함한다.
