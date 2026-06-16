# KeyHint for Mac

**KeyHint for Mac** translates the shortcuts you actually press, locally.

KeyHint는 Mac 파워유저와 개발자가 방금 실제로 누른 단축키를 현재 활성 앱 기준으로 즉시 해석해 주는 로컬 Mac 단축키 메모리 레이어입니다. 첫 번째 wedge는 HUD입니다. 최종 목표는 단순 키 표시가 아니라, 앱별 단축키 의미를 로컬에서 기억하고 Unknown을 회수하며 개인 설정/import로 정확도를 높이는 것입니다.

## 현재 상태

- 상태: Ralph 구현 단계 진행 중
- 현재 완료: PRD, 테스트 스펙, 구현 계획, README quickstart 계약, Tauri v2 scaffold, mock HUD 화면/상태 모델, developer command 구현, native event collector policy spike, active app resolver policy spike
- 아직 없음: 실제 CGEventTap 시작/권한 플로우
- 기준 문서:
  - [`docs/PRD.md`](docs/PRD.md)
  - [`docs/test-spec.md`](docs/test-spec.md)
  - [`docs/implementation-plan.md`](docs/implementation-plan.md)
  - [`docs/native-event-collector-spike.md`](docs/native-event-collector-spike.md)
  - [`docs/active-app-resolver-spike.md`](docs/active-app-resolver-spike.md)
  - [`KEYHINT_RALPH_STEPS.md`](KEYHINT_RALPH_STEPS.md)

## 5분 Quickstart

> Tauri scaffold와 developer command 표면이 생성되어 `npm install`, `npm run check`, `npm run build`, `npm run tauri:dev`, `npm run keyhint -- ...` 경로를 사용할 수 있습니다.

### 1. 저장소 확인

```bash
git status
```

기대 결과:

- 작업 중인 변경사항이 없다.
- `docs/PRD.md`, `docs/test-spec.md`, `docs/implementation-plan.md`가 존재한다.

### 2. 의존성 설치

```bash
npm install
```

기대 결과:

- Node/Tauri 의존성이 설치된다.
- 설치 실패 시 `docs/troubleshooting.md`의 install 섹션을 확인한다.

### 3. 개발 서버 실행

```bash
npm run dev
```

기대 결과:

- KeyHint 개발 앱이 실행된다.
- 권한이 없으면 실제 shortcut collector는 시작하지 않는다.
- mock HUD preview는 권한 없이 볼 수 있다.

### 4. 환경 진단

```bash
npm run keyhint -- doctor
```

기대 결과:

- macOS 버전, Tauri 개발 환경, Input Monitoring 상태, shortcut maps 상태를 요약한다.
- 실패는 Problem/Cause/Fix/Docs 형식으로 표시한다.

## 2분 Permissionless Mock HUD Demo

Input Monitoring 권한을 주기 전에 제품 가치를 확인할 수 있어야 합니다.

### Mock known shortcut

```bash
npm run keyhint -- hud:test --shortcut Command+P --app Cursor --meaning "Go to File" --source imported
```

예상 HUD:

```text
Go to File
⌘ P
Cursor · Verified · Source: imported keybindings
```

### Mock unknown shortcut

```bash
npm run keyhint -- hud:test --shortcut Command+Shift+X --app Cursor --unknown
```

예상 HUD:

```text
Not learned yet
⌘ ⇧ X
Cursor · Saved to Unknowns · No raw text stored
```

### Mock permission missing

```bash
npm run keyhint -- hud:test --permission denied
```

예상 HUD:

```text
KeyHint cannot see shortcuts yet
Input Monitoring is disabled
Open System Settings
```


### 현재 구현된 mock preview URL

Tauri/native 권한 없이 Vite 화면과 CLI에서 바로 확인할 수 있습니다.

```text
http://127.0.0.1:1420/?mock=known&shortcut=Command%2BP&app=Cursor&meaning=Go+to+File&source=imported+keybindings
http://127.0.0.1:1420/?mock=unknown&shortcut=Command%2BShift%2BX&app=Cursor
http://127.0.0.1:1420/?mock=permission
```

검증:

```bash
npm run test:mock-hud
```

## 권한 caveat

KeyHint는 실제 단축키 감지를 위해 macOS Input Monitoring 권한이 필요할 수 있습니다. 이 권한은 민감하므로 앱은 다음 순서를 지켜야 합니다.

1. 권한 요청 전에 local-only 동작을 설명한다.
2. raw text와 raw key stream을 저장하지 않는다고 명시한다.
3. 네트워크가 기본적으로 꺼져 있음을 보여준다.
4. 로컬 데이터 보기/삭제 경로를 제공한다.
5. signed/notarized 또는 internal-only alpha 상태를 표시한다.
6. 그 다음 System Settings로 이동해 Input Monitoring을 안내한다.

저장 가능한 값은 bundle id, canonical shortcut, coarse timestamp, app version, source status입니다. raw text, password field content, IME composing text는 저장하지 않습니다.

## 개발자 명령 계약

초기 CLI 또는 package script는 다음 표면을 제공해야 합니다.

```bash
keyhint dev
keyhint doctor
keyhint hud:test --shortcut Command+P --app Cursor
keyhint permissions:check
keyhint maps:validate
keyhint diagnostics:redact
```

Tauri scaffold 전까지는 `npm run keyhint -- <command>` 형태로 동일 계약을 제공할 수 있습니다.

## Troubleshooting

상세 문서는 단계 12에서 [`docs/troubleshooting.md`](docs/troubleshooting.md)로 작성됩니다. 모든 오류는 아래 형식을 따릅니다.

```text
Problem: KeyHint cannot see shortcuts
Cause: Input Monitoring is disabled
Fix: Enable System Settings -> Privacy & Security -> Input Monitoring
Docs: docs/troubleshooting.md#input-monitoring
```

초기 오류 카탈로그 대상:

- Input Monitoring denied
- event tap disabled
- overlay fallback needed
- no active app
- stale app context
- secure input paused
- local store unavailable
- map conflict
- not signed/notarized

## 구현 순서

전체 순서는 [`KEYHINT_RALPH_STEPS.md`](KEYHINT_RALPH_STEPS.md)를 따릅니다. 다음 단계는 Tauri v2 scaffold 생성입니다.
