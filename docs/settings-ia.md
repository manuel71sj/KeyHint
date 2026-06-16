# Settings IA

작성일: 2026-06-16  
범위: KeyHint 단계 11

## Interface intent

- Human: Mac 파워유저/개발자가 권한을 주기 전후에 KeyHint가 무엇을 보고, 무엇을 저장하지 않고, 어떤 source를 믿는지 빠르게 확인한다.
- Task: Status/Privacy/HUD/Sources/Unknowns/Apps/Diagnostics를 오가며 shortcut memory를 신뢰 가능한 상태로 만든다.
- Feel: 차갑고 정밀한 개발자 도구지만, 권한/Unknown 회수는 불안하지 않게 설명하는 조용한 ledger.

## Domain exploration

- keystroke ledger
- foreground app context
- source precedence ladder
- local memory vault
- Unknown recovery queue
- permission trust checklist

## Color world

- graphite aluminum keyboard deck
- warm keycap legends
- phosphor HUD glow
- amber unresolved warning light
- blue privacy pane tint
- dim terminal glass

## Signature

Settings는 generic preference list가 아니라 **Capture → Context → Meaning → Memory** rail이다. 사용자가 “지금 KeyHint가 뭘 신뢰하고 저장하는가”를 shortcut lifecycle 순서로 본다.

## Defaults rejected

| Default | Replacement |
|---|---|
| generic settings sidebar | shortcut lifecycle 순서의 trust sequence rail |
| flat preference toggles | local proof cards |
| shortcut dictionary table | Unknown recovery queue + source precedence ladder |

## Sections

1. Status — trust before capture
2. Privacy — what never enters memory
3. HUD — meaning-first overlay
4. Sources — source precedence ladder
5. Unknowns — recover missed shortcuts
6. Apps — per-app memory health
7. Diagnostics — export only what is safe

## Verification

```bash
npm run test:settings-ia
npm run test
npm run build
npm audit --audit-level=high
```
