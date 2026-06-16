# KeyHint Privacy Contract

작성일: 2026-06-16  
범위: 로컬 Mac 앱 alpha

KeyHint는 방금 누른 shortcut의 **앱별 의미**를 해석하기 위해 필요한 최소 metadata만 로컬에 저장한다. 제품 신뢰 순서는 “권한 요청 전 설명 → 로컬 동작 확인 → raw input 미저장 확인 → 사용자가 권한 부여”다.

## Local-only defaults

- 네트워크 전송은 기본적으로 비활성화한다.
- shortcut memory, Unknown inbox, diagnostics는 로컬 파일/로컬 store에만 존재한다.
- cloud sync, telemetry, shared dictionary upload는 MVP 범위가 아니다.

## Stored data

저장 가능:

- app bundle id
- app display name
- app version 또는 map version
- canonical shortcut (`Command+P` 등)
- source kind와 confidence
- 1시간 coarse timestamp bucket
- 사용자 라벨/override meaning
- redacted diagnostics summary

저장 금지:

- `rawText`
- `rawKeyStream`
- password field content
- `imeText` 또는 IME composing text
- modifier-less typing stream
- full exact timestamp stream

## Permission boundary

Input Monitoring 또는 event tap 권한이 필요한 기능은 다음 순서를 지킨다.

1. KeyHint가 local-only임을 설명한다.
2. raw text/raw key stream을 저장하지 않는다고 보여준다.
3. 권한 없이 mock HUD와 Settings IA를 먼저 볼 수 있게 한다.
4. 권한이 꺼져 있으면 collector를 시작하지 않는다.
5. 권한 부여 후에도 secure input/IME/plain text는 수집하지 않는다.

## Diagnostics redaction

`npm run diagnostics:redact` 출력은 문제 해결에 필요한 요약만 포함한다.

필수 redaction:

- `rawText: "[REDACTED]"`
- `rawKeyStream: "[REDACTED]"`
- queue depth/dropped/coalesced summary만 포함
- active app은 bundle id/display name metadata만 포함

## Delete/export expectation

향후 Settings의 Privacy 화면은 다음 동작을 제공해야 한다.

- local store 위치 표시
- Unknown inbox 삭제
- app별 shortcut memory 삭제
- redacted diagnostics export
- no-network 상태 확인

