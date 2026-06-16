# KeyHint for Mac PRD

작성일: 2026-06-16  
상태: Ralph 단계 1 기준 실행 PRD  
기준 기획서: `/Users/manuel71/.gstack/projects/manuel71sj-KeyHint/manuel71-main-design-20260616-081323.md`

## 1. 제품 정의

**KeyHint for Mac**은 Mac 파워유저와 개발자가 방금 실제로 누른 단축키를 현재 활성 앱 기준으로 즉시 해석해 주는 로컬 Mac 단축키 메모리 레이어다.

초기 wedge는 HUD다. 그러나 제품의 중심은 “단축키를 예쁘게 보여주는 앱”이 아니라, 앱별 의미를 로컬에서 학습하고 Unknown을 회수하며 사용자 override/import로 정확도를 높이는 개인용 단축키 기억 시스템이다.

## 2. 1차 사용자

- Mac 파워유저
- 개발자
- Cursor, VS Code, Finder, iTerm2, Chrome을 자주 쓰는 키보드 중심 사용자
- 새 앱/IDE 설정의 단축키 의미를 빠르게 몸에 익히려는 사용자

## 3. 핵심 차별점

KeyHint는 사전 목록이 아니다.

- 사용자가 **실제로 방금 누른 단축키**를 관찰한다.
- 현재 활성 앱을 확인한 뒤 앱별 의미를 해석한다.
- 모르는 단축키는 로컬 Unknown 후보로 안전하게 저장한다.
- 사용자가 라벨링하거나 keybinding을 import하면서 개인화된다.

## 4. MVP 범위

### 포함

- macOS 전용 앱
- Tauri v2 기반 UI + Rust/native macOS 계층
- 권한 없는 mock HUD preview
- Input Monitoring 권한 안내와 상태 표시
- modifier + key 조합 감지
- foreground app bundle id/display name 식별
- meaning-first HUD
- Cursor / VS Code / Finder 우선 지원
- 이후 iTerm2 / Chrome 확장 가능 구조
- shortcut source hierarchy
- 로컬 Unknown inbox
- 사용자 override / imported keybindings 경로
- Settings: Status, Privacy, HUD, Shortcut Sources, Unknowns, Supported Apps, Diagnostics
- no-network mode
- signed/notarized 또는 internal-only shareable alpha gate

### 제외

- 모든 앱 자동 지원
- cloud sync
- 사용자 계정
- 커뮤니티 shortcut DB
- App Store 배포
- AI-generated shortcut explanation
- full command palette
- interactive HUD labeling

## 5. 제품 원칙

1. **로컬 우선**: raw text, raw key stream, 입력 본문을 저장하지 않는다. 네트워크는 기본적으로 꺼진다.
2. **신뢰가 기능이다**: Input Monitoring 요청 전 local-only, no raw text, no-network, signed/notarized 또는 internal-only 상태를 설명한다.
3. **Unknown은 실패가 아니다**: Unknown shortcut은 안전하게 저장되고 사용자가 Label, Ignore, Import로 회수할 수 있어야 한다.
4. **source hierarchy가 정확도다**: user override와 imported keybindings가 seed map보다 우선한다.
5. **HUD는 방해하지 않는다**: 포커스를 훔치지 않고 짧게 표시되며, 편집은 Settings에서 한다.
6. **권한 없이 첫 가치를 보여준다**: mock HUD preview는 Input Monitoring 없이 실행되어야 한다.

## 6. 주요 사용자 흐름

### 6.1 첫 실행

1. 가치 제안: “KeyHint translates the shortcuts you actually press, locally.”
2. 신뢰 설명: local-only, raw text 미저장, network disabled by default, local data viewer/delete, build trust 상태
3. HUD preview demo
4. 지원 앱 예시: Cursor, VS Code, Finder
5. Input Monitoring 권한 설명 및 System Settings 이동
6. 첫 성공 과제: “Try ⌘P in Cursor or VS Code.”
7. 성공 상태: HUD test succeeded, app detected, shortcuts loaded

### 6.2 Known shortcut HUD

```text
Go to File
⌘ P
Cursor · Verified · Source: imported keybindings
```

### 6.3 Unknown shortcut HUD

```text
Not learned yet
⌘ ⇧ X
Cursor · Saved to Unknowns · No raw text stored
```

### 6.4 Permission missing HUD

```text
KeyHint cannot see shortcuts yet
Input Monitoring is disabled
Open System Settings
```

## 7. Settings IA

- **Status**: Input Monitoring, collector, active app detection, loaded maps, known/unknown counters
- **Privacy**: local-only, raw text never stored, secure input pause, view/delete local data
- **HUD**: preview/test, position, duration, display, theme, reduced motion
- **Shortcut Sources**: source order, imported keybindings, seed maps, stale/conflict warning
- **Unknowns**: captured unknowns, Label, Ignore, Mark as app command, Import keybindings
- **Supported Apps**: coverage, app version, known-rate, last verified
- **Diagnostics**: event tap retries, overlay fallback, redacted diagnostic bundle

## 8. 데이터/저장 정책

저장 가능:

- bundle id
- canonical shortcut
- coarse timestamp
- app version
- source status
- unknown type

저장 금지:

- raw text
- raw key stream
- password field content
- IME composing text

## 9. 핵심 아키텍처

```text
macOS Input / Accessibility Boundary
  -> Permission Manager
  -> Event Collector
  -> Secure Input / IME / Plain Text Filter
  -> Bounded Event Queue
  -> Active App Resolver
  -> Key Normalizer
  -> Shortcut Source Resolver
  -> Matcher
  -> HUD State Emitter
  -> HudRenderer interface
  -> Local Memory Store
  -> Settings / Onboarding
```

## 10. Source precedence

```text
user override
  > imported keybindings
  > menu introspection
  > official/app source
  > seed map
  > system map
  > unknown
```

## 11. Alpha 성공 기준

### 제품

- Alpha supported apps known-rate 70% 이상
- dogfooder permission grant 60% 이상
- D3 still enabled 50% 이상
- annoyance disable 20% 미만
- 3일 dogfood 중 한 개 이상의 shortcut learned/corrected self-report

### 기술

- event-to-HUD latency p95 <= 100ms 목표
- 10x shortcut burst에서 queue bounded
- raw text persistence 없음
- diagnostics redaction 통과
- fullscreen/multi-display fallback spike 결과 기록

### DX

- mock HUD TTHW < 2분
- repository quickstart TTHW < 5분
- `doctor` pass/fail 원인 명확
- map validation command 존재

## 12. Release gate

Shareable alpha 전 필수:

- signed/notarized 또는 internal-only label
- no-network mode 검증
- diagnostics redaction test 통과
- local data viewer/delete 존재
- privacy page 존재
- release checklist 존재

## 13. MVP 진행 원칙

1. 문서/계약을 먼저 잠근다.
2. 권한 없는 mock HUD로 TTHW를 만든다.
3. Tauri scaffold를 만든다.
4. macOS native spike는 권한/보안/실패 모드를 명시적으로 기록한다.
5. Unknown/local memory loop를 MVP 구조로 포함한다.
6. 각 단계는 `KEYHINT_RALPH_STEPS.md`에 완료 보고와 커밋 해시를 남긴다.
