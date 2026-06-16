# KeyHint Dogfood QA Report

작성일: 2026-06-16  
단계: 15 — `$ultraqa`/`$qa` 대체 가능한 repo-local QA evidence

현재 repo 상태는 실제 CGEventTap 시작과 native NSPanel 표시 전 단계다. 따라서 Stage 15는 **권한 없는 자동 smoke + 수동 dogfood matrix**를 분리해 기록한다. Input Monitoring 권한 부여, fullscreen Spaces, Stage Manager, remote desktop은 사용자의 Mac UI 상태를 바꾸는 수동 QA로 남긴다.

## Automated smoke results

| Scenario | Evidence | Result |
|---|---|---|
| HUD known preview | `http://127.0.0.1:1420/?mock=known&shortcut=Command%2BP&app=Cursor&meaning=Go+to+File` HTTP 200 | PASS |
| HUD unknown preview | `http://127.0.0.1:1420/?mock=unknown&shortcut=Command%2BShift%2BX&app=Cursor` HTTP 200 | PASS |
| Permission missing preview | `http://127.0.0.1:1420/?mock=permission` HTTP 200 | PASS |
| Settings IA | `http://127.0.0.1:1420/?view=settings&section=unknowns` HTTP 200 | PASS |
| source maps | `npm run maps:validate` | PASS |
| redaction | `npm run diagnostics:redact` plus tests | PASS |
| native matrix | `npm run renderer:matrix`, native tests | PASS |

## Manual dogfood matrix

| Scenario | Goal | Status | How to verify |
|---|---|---|---|
| standard desktop HUD | HUD appears without focus steal | READY_FOR_MANUAL | Run app, press known shortcut in Cursor, verify meaning-first HUD |
| fullscreen Spaces | fallback appears above fullscreen app | MANUAL_REQUIRED | Enter fullscreen app, trigger shortcut, record whether native fallback is needed |
| Stage Manager | active display/window assumptions hold | MANUAL_REQUIRED | Enable Stage Manager, trigger shortcut across windows |
| multi-display | HUD appears on foreground app display | MANUAL_REQUIRED | Move Cursor to secondary display and trigger shortcut |
| remote desktop | remote/session behavior is safe | MANUAL_REQUIRED | Test in remote desktop/session lock context |
| reduced motion | no distracting animation | READY_FOR_MANUAL | Enable Reduce Motion and inspect HUD transition |
| Input Monitoring grant/revoke/relaunch | permission state remains explicit | MANUAL_REQUIRED | Grant/revoke permission and relaunch app |
| Secure Event Input | capture pauses in secure fields | MANUAL_REQUIRED | Focus password field and ensure no event enqueue |
| IME composing/dead key | composing text is ignored | MANUAL_REQUIRED | Use Korean IME/dead key sequence and verify no raw text |
| password field suppression | password content never stored | MANUAL_REQUIRED | Trigger in password field and inspect diagnostics/store |
| 10x shortcut burst | queue coalesces/drops safely | READY_FOR_MANUAL | Press shortcut rapidly and compare queue summary |

## QA verdict

- Automated repo-local QA: PASS
- Manual macOS dogfood: READY, not executed in this non-interactive run
- Release implication: do not claim signed/notarized production readiness until manual dogfood rows are executed and recorded.

