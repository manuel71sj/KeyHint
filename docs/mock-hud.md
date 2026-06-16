# Permissionless mock HUD

작성일: 2026-06-16

## 목적

Input Monitoring 권한 없이 KeyHint의 첫 가치를 확인한다. mock HUD는 실제 keyboard event collector를 시작하지 않고 query string과 fixture 상태만으로 Known, Unknown, Permission missing 상태를 보여준다.

## 실행

```bash
npm run dev
```

브라우저 또는 Tauri webview에서 다음 URL을 연다.

```text
http://127.0.0.1:1420/?mock=known&shortcut=Command%2BP&app=Cursor&meaning=Go+to+File&source=imported+keybindings
http://127.0.0.1:1420/?mock=unknown&shortcut=Command%2BShift%2BX&app=Cursor
http://127.0.0.1:1420/?mock=permission
```

## 상태 계약

| 상태 | 첫 줄 | 둘째 줄 | 셋째 줄 |
|---|---|---|---|
| Known | 의미 | canonical shortcut | 앱 · Verified · Source |
| Unknown | Not learned yet | canonical shortcut | 앱 · Saved to Unknowns · No raw text stored |
| Permission | KeyHint cannot see shortcuts yet | Input Monitoring disabled | Open System Settings · Local only · No raw text stored |

## 검증

```bash
npm run test:mock-hud
npm run check
npm run build
```
