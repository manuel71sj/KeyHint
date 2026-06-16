# KeyHint 구현 계획

작성일: 2026-06-16  
상태: Ralph 단계 1 기준 실행 계획  
운영 원장: `KEYHINT_RALPH_STEPS.md`

## 1. 실행 방식

- `$ralph`로 순서대로 진행한다.
- 각 단계는 적합한 스킬/표면을 사용한다.
- 각 단계 종료 시 `KEYHINT_RALPH_STEPS.md`에 상태, 완료 보고, 검증 근거, 커밋 해시를 기록한다.
- 각 단계 종료 시 커밋한다.
- 구현 전 planning gate는 `.omx/plans/prd-keyhint.md`와 `.omx/plans/test-spec-keyhint.md` 존재로 만족한다.
- `claude -p`는 사용하지 않는다.

## 2. Milestone 0 — 문서/계약 잠금

### 단계 1: PRD/test-spec/implementation-plan 분리

산출물:

- `docs/PRD.md`
- `docs/test-spec.md`
- `docs/implementation-plan.md`
- `.omx/plans/prd-keyhint.md`
- `.omx/plans/test-spec-keyhint.md`

완료 기준:

- 승인 기획서의 local memory layer, meaning-first HUD, Unknown loop, trust-before-permission 원칙이 repo-local 문서에 반영된다.
- Ralph planning gate 파일이 존재한다.

## 3. Milestone 1 — DX와 permissionless value

### 단계 2: README quickstart + mock HUD 계약

- README에 제품 가치, 현재 상태, 5분 quickstart, 2분 mock HUD preview, 권한 caveat, troubleshooting 링크를 작성한다.
- mock HUD 명령은 권한 없이 실행 가능해야 한다.

### 단계 3: Tauri v2 scaffold

- 공식 Tauri v2 create/develop 문서를 확인한다.
- `package.json`, `src/`, `src-tauri/` 기본 구조를 만든다.
- dev/test/check script를 정의한다.

### 단계 4: Permissionless mock HUD demo

- mock shortcut/app 입력으로 HUD state를 볼 수 있게 한다.
- Known, Unknown, Permission missing 상태 fixture를 만든다.
- HUD는 meaning-first hierarchy를 따른다.

### 단계 5: Developer command surface

초기 명령 또는 package script 계약:

```bash
keyhint dev
keyhint doctor
keyhint hud:test --shortcut Command+P --app Cursor
keyhint permissions:check
keyhint maps:validate
keyhint diagnostics:redact
```

실제 CLI가 없을 경우 `npm run keyhint -- <command>` 또는 대응 script로 먼저 제공한다.

## 4. Milestone 2 — macOS native spike

### 단계 6: Event collector spike

- CGEventTap 또는 동등 API 가능성을 검증한다.
- Input Monitoring, Secure Event Input, IME/dead key/plain text 정책을 문서화한다.
- callback은 enqueue-only라는 구조를 유지한다.

### 단계 7: Active app resolver spike

- foreground app bundle id/display name 획득을 검증한다.
- nil/no_active_app/stale_context/resolver_unavailable 상태를 구분한다.
- context가 불명확하면 Unknown 저장을 금지한다.

### 단계 8: HUD overlay/native fallback boundary

- `HudRenderer` interface를 정의한다.
- Tauri renderer와 native NSPanel/NSWindow fallback capability matrix를 작성한다.
- fullscreen Spaces, Stage Manager, multi-display checklist를 둔다.

## 5. Milestone 3 — Local memory loop

### 단계 9: Shortcut source resolver + local store schema

- source precedence를 코드/문서/테스트 계약으로 확정한다.
- UnknownCandidate, UserOverride, ShortcutSource metadata schema를 정의한다.
- migration dry-run과 redaction contract를 포함한다.

### 단계 10: Local Unknown inbox

- Unknown 저장/조회/라벨/무시/import 흐름을 구현한다.
- raw text 없이 Unknown 후보를 회수할 수 있어야 한다.

### 단계 11: Settings IA

- Status, Privacy, HUD, Shortcut Sources, Unknowns, Supported Apps, Diagnostics 화면 또는 scaffold를 만든다.
- keyboard navigation과 visible focus ring을 반영한다.

## 6. Milestone 4 — Trust docs and tests

### 단계 12: Privacy/troubleshooting/release docs

- `docs/privacy.md`
- `docs/troubleshooting.md`
- `docs/release.md`

오류 카탈로그 형식:

```text
Problem: KeyHint cannot see shortcuts
Cause: Input Monitoring is disabled
Fix: Enable System Settings -> Privacy & Security -> Input Monitoring
Docs: docs/troubleshooting.md#input-monitoring
```

### 단계 13: Automated tests

- normalizer/matcher/queue/permission/redaction 테스트를 추가한다.
- native-only 항목은 수동 checklist와 자동 seam을 분리한다.

## 7. Milestone 5 — Review, QA, release readiness

### 단계 14: Code review + architect verification

- fresh lint/type/build/test를 실행한다.
- architect subagent verification을 수행한다.
- ai-slop-cleaner 범위 검토 또는 deslop pass 후 regression re-verification을 수행한다.

### 단계 15: QA/dogfood plan

- HUD, 권한, fullscreen, multi-display, Secure Input 결과를 기록한다.
- dogfood known-rate/annoyance/retention 측정 경로를 둔다.

### 단계 16: Release prep

- signed/notarized 또는 internal-only label을 확인한다.
- no-network, diagnostics redaction, privacy page, local delete, release checklist를 확인한다.

## 8. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 단순 HUD demo로 축소 | Unknown/local memory loop를 MVP milestone에 포함 |
| Input Monitoring 권한 거부 | trust-before-permission onboarding + mock HUD preview |
| custom keybinding 불일치 | user override/imported keybindings 우선순위 |
| native overlay 실패 | HudRenderer interface + native fallback spike |
| sensitive input 저장 | 저장 금지 필드와 redaction tests |
| TTHW blocked | README quickstart + mock HUD command 먼저 작성 |

## 9. 다음 단계

단계 2에서 README quickstart와 permissionless mock HUD demo 계약을 작성한다. 이후 Tauri scaffold 전까지 사용자는 권한 없이 제품 가치를 이해하고 개발자는 첫 실행 경로를 확인할 수 있어야 한다.
