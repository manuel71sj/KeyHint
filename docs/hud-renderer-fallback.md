# HUD renderer and native fallback matrix

작성일: 2026-06-16  
상태: 단계 8 renderer boundary spike

## 목적

HUD는 KeyHint의 첫 wedge지만 focus를 훔치거나 fullscreen/Stage Manager/multi-display에서 사라지면 안 된다. 단계 8은 실제 NSPanel 구현 전 renderer 경계와 fallback 판단을 고정한다.

## Interface contract

```text
HudRenderer.show(state)
```

계약:

- non-interactive
- keyboard focus를 훔치지 않음
- in-flight HUD state는 최신 shortcut으로 replace
- Settings가 수정/검증 UI를 소유
- 기본 위치: active display bottom-center, Dock/safe area 위
- max width: 520px
- reduced motion: opacity-only/no-slide

## Capability matrix

| Scenario | Primary | Fallback | Manual check |
|---|---|---|---|
| standard desktop | Tauri window | native panel | no |
| fullscreen Spaces | native panel | Tauri window | yes |
| Stage Manager | native panel | Tauri window | yes |
| multi-display | Tauri window | native panel | yes |
| remote desktop/session lock | native panel | none | yes |
| reduced motion | Tauri window | native panel | no |

## 구현 seam

- Rust policy module: `src-tauri/src/native/hud_renderer.rs`
- Tauri command: `hud_renderer_spike`
- Developer command: `npm run renderer:matrix`
- Unit tests: `cargo test --manifest-path src-tauri/Cargo.toml hud_renderer`

## 다음 단계 리스크

- 실제 NSPanel/NSWindow focus behavior는 수동 macOS spike가 필요하다.
- fullscreen Spaces와 Stage Manager는 OS/설정별 차이가 있으므로 QA 단계에서 반드시 dogfood한다.
- multi-display active display 선택은 active app/window resolver와 결합해야 한다.
