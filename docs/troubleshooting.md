# KeyHint Troubleshooting

작성일: 2026-06-16

모든 오류는 Problem/Cause/Fix/Verify 형식으로 작성한다.

## Input Monitoring denied

Problem: KeyHint cannot see shortcuts.  
Cause: macOS Input Monitoring permission is denied or not granted.  
Fix: System Settings → Privacy & Security → Input Monitoring에서 KeyHint for Mac을 켠 뒤 앱을 재시작한다.  
Verify: `npm run permissions:check`가 수동 확인 경로를 안내하고, 실제 collector 단계에서는 권한 상태가 `granted`로 표시되어야 한다.

## Event tap disabled

Problem: shortcut capture stops while app is running.  
Cause: macOS가 event tap을 비활성화했거나 권한이 run 중 revoke됐다.  
Fix: collector를 중지하고 permission state를 `revoked_during_run` 또는 `needs_restart`로 표시한 뒤 재시작을 안내한다.  
Verify: `npm run event:spike`의 supported permission states에 revoke/restart 상태가 포함된다.

## Overlay fallback needed

Problem: HUD does not appear above fullscreen, Stage Manager, remote desktop, or multi-display context.  
Cause: Tauri window overlay가 해당 window level/Space에서 충분하지 않다.  
Fix: native panel fallback을 사용하고 focus-safe/non-interactive 계약을 유지한다.  
Verify: `npm run renderer:matrix`에서 risky scenario가 `native_panel_fallback`을 primary로 표시한다.

## No active app

Problem: Unknown shortcut was pressed but inbox remains empty.  
Cause: foreground app bundle id/display name을 resolve하지 못했다.  
Fix: active app resolver를 재시도하고, resolver unavailable 상태에서는 Unknown을 저장하지 않는다.  
Verify: `npm run app:resolve`가 `resolved` 또는 `resolver_unavailable` 상태를 명확히 출력한다.

## Stale app context

Problem: shortcut meaning appears under the wrong app.  
Cause: shortcut event와 active app context의 freshness window가 맞지 않는다.  
Fix: `FRESHNESS_WINDOW_MS = 250` 기준을 넘으면 Unknown 저장과 matching을 차단한다.  
Verify: `npm run test:source-resolver`가 stale/unresolved context 저장 차단을 검증한다.

## Secure input paused

Problem: KeyHint pauses capture in password fields or secure input contexts.  
Cause: Secure Event Input이 활성화되었거나 의심된다.  
Fix: event collector를 pause하고 HUD/Settings에 privacy-safe 상태를 표시한다.  
Verify: `npm run event:spike`의 secure input policy가 pause/no enqueue를 명시한다.

## Local store unavailable

Problem: Unknown inbox cannot save records.  
Cause: local store path가 없거나 쓰기 권한이 없다.  
Fix: Settings Privacy에서 store path를 보여주고, CLI 테스트에서는 `KEYHINT_STORE_PATH`로 안전한 경로를 지정한다.  
Verify: `KEYHINT_STORE_PATH=/tmp/keyhint.json npm run keyhint -- unknown:add ...`가 성공한다.

## Map conflict

Problem: the HUD shows a meaning that differs from user expectation.  
Cause: imported, seed, system, or override source가 충돌한다.  
Fix: Sources 화면에서 losing conflicts를 보여주고, user override로 수정한다.  
Verify: `npm run test:source-resolver`가 user override precedence를 검증한다.

## Not signed/notarized

Problem: macOS permission prompts or launch behavior differ from expected alpha flow.  
Cause: app is not signed/notarized for release distribution.  
Fix: internal alpha임을 표시하고 release checklist에서 Developer ID signing/notarization을 완료한다.  
Verify: `docs/release.md`의 signing/notarization checklist를 완료한다.

