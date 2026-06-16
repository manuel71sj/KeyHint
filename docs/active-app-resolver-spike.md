# Active app resolver spike

작성일: 2026-06-16  
상태: 단계 7 policy/code spike

## 목적

shortcut 의미 해석과 UnknownCandidate 저장은 현재 foreground app context가 정확할 때만 가능하다. resolver가 nil/stale/unavailable이면 Unknown을 저장하지 않는다.

## 로컬 확인

이 환경에서는 다음 fallback이 동작했다.

```bash
osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
osascript -e 'tell application "System Events" to get bundle identifier of first application process whose frontmost is true'
```

확인 결과 예시:

- display name: `MSTeams`
- bundle id: `com.microsoft.teams2`

## 상태 모델

- `resolved`: bundle id와 display name이 있고 event timestamp 대비 fresh
- `no_active_app`: foreground app 없음
- `stale_context`: app switch race 또는 오래된 관측값
- `resolver_unavailable`: API/권한/환경 문제로 resolver 실패

## 저장 guard

`UnknownCandidate`는 아래 조건에서만 저장한다.

1. `state == resolved`
2. `bundle_id`가 비어 있지 않음
3. `display_name`이 비어 있지 않음
4. event timestamp 대비 active app context가 stale이 아님

그 외에는 HUD에 상태만 표시하고 local Unknown inbox에는 저장하지 않는다.

## 구현 seam

- Rust policy module: `src-tauri/src/native/active_app.rs`
- Tauri command: `active_app_spike`
- Developer command: `npm run app:resolve`
- Unit tests: `cargo test --manifest-path src-tauri/Cargo.toml active_app`

## 다음 단계 리스크

- `System Events` fallback은 사용자 환경에서 Automation/Accessibility 프롬프트와 충돌할 수 있다.
- 제품 구현은 NSWorkspace `frontmostApplication` 또는 Tauri/Rust macOS binding을 우선 검토한다.
- app switch race는 event queue timestamp와 resolver timestamp를 묶어 테스트해야 한다.
