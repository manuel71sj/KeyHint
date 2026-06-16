# KeyHint developer commands

작성일: 2026-06-16

## 목적

단계 5는 앱 구현과 native spike 전에 개발자 명령 표면을 고정한다. 모든 명령은 로컬에서 실행되며 macOS Input Monitoring 권한을 요청하지 않는다.

## 명령

```bash
npm run keyhint -- doctor
npm run keyhint -- hud:test --shortcut Command+P --app Cursor --meaning "Go to File" --source "imported keybindings"
npm run keyhint -- hud:test --shortcut Command+Shift+X --app Cursor --unknown
npm run keyhint -- hud:test --permission denied
npm run keyhint -- permissions:check
npm run keyhint -- maps:validate
npm run keyhint -- diagnostics:redact
```

## 검증

```bash
npm run test:cli
npm run test
```

## 보안/프라이버시 계약

- `doctor`는 local-only와 raw text 미저장 상태를 표시한다.
- `permissions:check`는 현재 단계에서 collector를 시작하지 않는다.
- `maps:validate`는 shortcut map에 `rawTextStored: false`를 요구한다.
- `diagnostics:redact`는 raw text와 raw key stream을 `[REDACTED]`로 출력한다.
