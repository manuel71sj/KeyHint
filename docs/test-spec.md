# KeyHint 테스트 스펙

작성일: 2026-06-16  
상태: Ralph 단계 1 기준 테스트 계약  
목표: KeyHint MVP가 로컬 우선, meaning-first HUD, Unknown 회수 루프, macOS 권한 경계를 안전하게 만족하는지 검증한다.

## 1. 테스트 원칙

- raw text/raw key stream 저장 금지를 테스트 가능한 계약으로 둔다.
- 권한이 없어도 mock HUD와 주요 UI 상태는 검증 가능해야 한다.
- native macOS 권한/overlay 항목은 자동화와 수동 spike checklist를 분리한다.
- event callback에서는 enqueue만 수행하고 matching/UI/storage를 하지 않는다.
- 실패 시 사용자에게 Problem/Cause/Fix/Docs 형식으로 회복 경로를 보여준다.

## 2. 자동화 테스트 범위

### 2.1 Key normalizer

- `Command+P`를 `⌘ P` 또는 canonical `Command+P`로 안정 변환한다.
- modifier 순서는 canonical order를 따른다.
- 좌/우 modifier 차이는 MVP에서 합친다.
- Fn/media key는 명시적으로 supported/unsupported 상태를 반환한다.
- IME composing, dead key, plain typing은 shortcut 후보에서 제외한다.

### 2.2 Event filter / permission state

- permission states: `not_determined`, `denied`, `granted`, `revoked_during_run`, `needs_restart`
- Secure Event Input active 시 collector가 paused 상태가 된다.
- password field 또는 plain text 입력 추정 이벤트는 저장되지 않는다.
- modifier 없는 일반 typing은 UnknownCandidate가 되지 않는다.

### 2.3 Bounded queue

- 고정 크기 초과 시 stale event를 drop 또는 replace-in-flight한다.
- 같은 chord/app 반복은 coalesce한다.
- queue depth, dropped count, coalesced count metric이 갱신된다.
- callback 내부에서 matcher, renderer, storage를 호출하지 않는 구조를 검증한다.

### 2.4 Active app resolver

- foreground app bundle id/display name을 반환한다.
- nil/no_active_app/stale_context/resolver_unavailable 상태를 구분한다.
- app context가 불명확하면 UnknownCandidate를 저장하지 않는다.

### 2.5 Shortcut source resolver / matcher

- precedence: user override > imported keybindings > menu introspection > official/app source > seed map > system map > unknown
- conflict 발생 시 사용자 override가 우선하며 conflict metadata를 남긴다.
- stale map은 stale warning을 반환한다.
- unsupported app, unmapped shortcut, possible custom shortcut, stale map, system fallback miss를 구분한다.

### 2.6 Local memory store

- UnknownCandidate 필드는 bundle id, canonical shortcut, coarse timestamp, app version, source status만 저장한다.
- raw text/raw key stream/password/IME text는 저장하지 않는다.
- schema_version/map_version이 존재한다.
- migration dry-run, corrupt store recovery, backup/restore, delete local data를 검증한다.

### 2.7 HUD state / renderer contract

- Known HUD는 의미를 첫 줄에 둔다.
- Unknown HUD는 `Saved to Unknowns`와 `No raw text stored`를 표시한다.
- Permission missing HUD는 System Settings 이동 상태를 표시한다.
- HUD는 non-interactive이며 포커스를 훔치지 않는 계약을 따른다.
- reduced motion에서는 opacity-only/no-slide로 동작한다.

### 2.8 Tauri command contract

- onboarding/status/settings command가 typed state를 반환한다.
- `keyhint doctor` 또는 package script 대응 명령이 환경 상태를 요약한다.
- `hud:test --shortcut Command+P --app Cursor`가 permissionless mock HUD state를 만든다.
- `maps:validate`가 shortcut map schema와 conflict를 검증한다.
- `diagnostics:redact`가 raw text 없이 redacted bundle을 만든다.

## 3. 수동 macOS spike checklist

- CGEventTap/event source visibility matrix
- Input Monitoring grant/revoke/relaunch
- Secure Event Input suppression
- password field suppression
- IME composing/dead key behavior
- fullscreen Spaces overlay
- Stage Manager overlay
- multi-display active display selection
- Retina/non-Retina scaling
- sleep/wake 후 collector 복구
- app switch race와 stale context guard
- remote desktop/session lock
- Gatekeeper/signed/notarized install flow

## 4. 성능/안정성 검증

- event-to-HUD latency p95 <= 100ms 목표
- 10x shortcut burst soak에서 queue bounded 유지
- 30분 dogfood session에서 memory/CPU 증가 bounded
- idle CPU와 active typing CPU 측정
- event tap retries metric 확인

## 5. 프라이버시/보안 검증

- no-network mode 검증
- diagnostics redaction test 통과
- local data viewer/delete 동작
- Secure Input active 상태에서 저장 없음
- 권한 요청 전 trust-before-permission copy 표시
- shareable alpha는 signed/notarized 또는 internal-only label 확인

## 6. 단계별 검증 매핑

| 단계 | 검증 |
|---:|---|
| 2 | README quickstart 링크/명령/권한 caveat grep |
| 3 | scaffold 파일 존재, package scripts, 기본 build/test 가능성 |
| 4 | mock HUD 상태 fixture 또는 UI smoke |
| 5 | developer command help/smoke |
| 6 | event collector spike 문서 + 가능한 unit seam |
| 7 | active app resolver status fixture/spike |
| 8 | renderer capability matrix + fallback checklist |
| 9 | source resolver/local store schema tests |
| 10 | Unknown inbox state/fixture tests |
| 11 | Settings IA 화면/scaffold smoke |
| 12 | privacy/troubleshooting/release 문서 링크 검증 |
| 13 | normalizer/matcher/queue/permission/redaction 자동화 테스트 |
| 14 | fresh lint/type/build/test + architect verification + deslop/reverify |
| 15 | dogfood QA 기록 |
| 16 | release checklist 검증 |
