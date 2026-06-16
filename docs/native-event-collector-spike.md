# macOS event collector spike

작성일: 2026-06-16  
상태: 단계 6 policy/code spike

## 공식 근거

- Apple Developer CoreGraphics / Quartz Event Services: event taps are the macOS-level path to observe/filter input events before foreground app delivery.
- Apple Developer `CGEvent.tapCreate`: event tap callback은 run loop source로 연결되어 이벤트 수신 시 호출되는 구조다.
- Apple Support Input Monitoring: macOS는 다른 앱 사용 중에도 키보드/마우스/트랙패드 입력을 모니터링할 수 있는 앱을 Privacy & Security > Input Monitoring에서 사용자가 허용/차단하게 한다.

Apple Developer 문서는 JS-rendered 페이지라 CLI fetch에서는 본문이 제한적으로 보이지만, API 표면과 공식 제목을 기준으로 spike 근거를 남긴다.

## Stage 6 결정

이 단계에서는 실제 CGEventTap을 시작하지 않는다.

이유:

- Input Monitoring 권한 요청은 사용자 신뢰/서명/온보딩과 결합되어야 한다.
- 현재 목표는 native 수집의 정책 seam을 코드로 고정하는 것이다.
- callback 안에서 matching/UI/storage/network가 실행되지 않아야 한다는 구조를 먼저 테스트한다.

## Collector 정책

- Permission states: `not_determined`, `denied`, `granted`, `revoked_during_run`, `needs_restart`
- callback contract: sanitized compact event enqueue only
- 저장 금지: raw text, raw key stream, password field content, IME composing text
- ignore/pause:
  - Secure Event Input active/suspected
  - IME composing
  - dead key sequence
  - plain text input
  - modifier 없는 typing

## 구현 seam

- Rust policy module: `src-tauri/src/native/event_collector.rs`
- Tauri command: `event_collector_spike`
- Developer command: `npm run event:spike`
- Unit tests: `cargo test --manifest-path src-tauri/Cargo.toml event_collector`

## 수동 spike checklist

- Input Monitoring grant/revoke/relaunch
- Secure Event Input suppression
- IME composing/dead key suppression
- password field suppression
- 10x shortcut burst queue behavior
- event tap disabled/re-enabled handling

## 다음 단계로 넘기는 리스크

- 실제 CGEventTap 생성/권한 상태 API는 Stage 6 이후 native spike에서 별도 브랜치로 다룬다.
- password field 판별은 앱별/Accessibility API의 신뢰성이 필요하므로 현재 단계에서는 conservative suppression 정책만 정의한다.
- IME/dead key 판별은 실제 keyboard layout matrix가 필요하다.
