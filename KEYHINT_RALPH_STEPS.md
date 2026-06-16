# KeyHint Ralph 실행 순서

생성일: 2026-06-16  
워크플로: `$ralph`  
기준 기획서: `/Users/manuel71/.gstack/projects/manuel71sj-KeyHint/manuel71-main-design-20260616-081323.md`  
운영 규칙: 각 단계 완료 후 이 파일에 완료 표시, 간단 완료 보고, 검증 근거, 커밋 해시를 기록한다.

## 상태 범례

- `[ ]` 대기
- `[~]` 진행 중
- `[x]` 완료
- `[!]` 차단/수동 검증 필요

## 실행 단계

| 단계 | 상태 | 적합한 스킬/표면 | 목표 | 완료 기준 | 완료 보고 |
|---:|:---:|---|---|---|---|
| 0 | [x] | `$ralph` | 실행 순서 문서와 Ralph 컨텍스트를 만든다 | 이 파일 생성, 컨텍스트 스냅샷 작성, 커밋 | 완료 — 실행 순서 원장과 컨텍스트 스냅샷 생성 |
| 1 | [x] | `$ralph` + planning gate | 승인 기획서를 repo-local PRD/테스트 스펙/구현 계획으로 분리한다 | `docs/PRD.md`, `docs/test-spec.md`, `docs/implementation-plan.md`, `.omx/plans/prd-keyhint.md`, `.omx/plans/test-spec-keyhint.md` 생성 | 완료 — PRD/테스트 스펙/구현 계획과 Ralph planning gate 파일 생성 |
| 2 | [x] | `$ralph` + DX | README quickstart와 permissionless mock HUD demo 계약을 작성한다 | README에 5분 quickstart, mock HUD 명령, 권한 caveat, troubleshooting 링크 추가 | 완료 — README quickstart와 mock HUD 명령 계약 작성 |
| 3 | [x] | `$ralph` + Tauri 공식 문서 확인 | Tauri v2 앱 scaffold를 만든다 | `package.json`, `src/`, `src-tauri/` 기본 구조, dev/test script 존재 | 완료 — Tauri v2 Vanilla TypeScript scaffold 생성 및 검증 |
| 4 | [x] | `$ralph` + frontend 구현 | permissionless mock HUD demo를 구현한다 | 권한 없이 mock HUD 화면/상태를 볼 수 있음 | 완료 — Known/Unknown/Permission mock HUD 상태 구현 및 URL preview 검증 |
| 5 | [x] | `$ralph` + DX | developer command 표면을 만든다 | `keyhint doctor`, `hud:test`, `maps:validate`, `diagnostics:redact` 또는 대응 script 동작 | 완료 — npm script 기반 keyhint developer command 구현 및 검증 |
| 6 | [x] | `$ralph` + native spike | macOS event collector spike를 구현/문서화한다 | Input Monitoring/CGEventTap 가능성, secure input, IME, plain text 정책이 검증/기록됨 | 완료 — native event collector 정책 seam과 안전 필터 테스트 구현 |
| 7 | [ ] | `$ralph` | active app resolver spike를 구현/문서화한다 | foreground app bundle id, nil/stale 상태 처리가 검증/기록됨 |  |
| 8 | [ ] | `$ralph` + UI/native spike | HUD overlay와 native fallback 경계를 구현/문서화한다 | Tauri renderer와 native fallback capability matrix/테스트 체크리스트 존재 |  |
| 9 | [ ] | `$ralplan` 후 `$ralph` | shortcut source resolver와 local store schema를 확정한다 | source precedence, UnknownCandidate, UserOverride, migration 계약과 테스트 존재 |  |
| 10 | [ ] | `$ralph` | local Unknown inbox를 구현한다 | Unknown 저장/라벨/무시/import 흐름이 동작 |  |
| 11 | [ ] | `$interface-design` 후 `$ralph` | Settings IA를 구현한다 | Status/Privacy/HUD/Sources/Unknowns/Apps/Diagnostics 화면 또는 scaffold 존재 |  |
| 12 | [ ] | `$ralph` + docs | privacy/troubleshooting/release 문서를 작성한다 | `docs/privacy.md`, `docs/troubleshooting.md`, `docs/release.md` 존재 |  |
| 13 | [ ] | `$ralph` + tests | 테스트 계획을 자동화 테스트로 반영한다 | normalizer/matcher/queue/permission/redaction 테스트 존재 |  |
| 14 | [ ] | `$code-review` + architect verification | 전체 코드 리뷰와 Ralph 검증을 수행한다 | fresh test/build/lint, architect approval, deslop/re-verify 완료 |  |
| 15 | [ ] | `$ultraqa` 또는 `$qa` | 실제 사용 QA 계획을 수행/문서화한다 | HUD, 권한, fullscreen, multi-display, secure input 결과 기록 |  |
| 16 | [ ] | `/ship` 또는 `$ralph` | 배포 준비를 문서화한다 | signed/notarized/no-network/GitHub Release checklist 준비 |  |

## 단계별 로그

### 단계 0 — 실행 순서 문서 생성

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 완료 보고: 실행 순서 문서와 Ralph 컨텍스트 스냅샷을 생성했고, 단계별 진행/검증/커밋 기록 원장을 초기화했다.
- 검증 근거: `KEYHINT_RALPH_STEPS.md` 존재, `.omx/context/keyhint-ralph-sequence-20260616T034348Z.md` 존재, `git log --oneline -2`에서 단계 0 커밋 확인.
- 커밋: `75548c3`, `bb94e38`


### 단계 1 — PRD/test-spec/implementation-plan 분리

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` planning gate
- 완료 보고: 승인 기획서를 repo-local PRD, 테스트 스펙, 구현 계획으로 분리했고 Ralph 구현 게이트 파일을 생성했다.
- 검증 근거: `docs/PRD.md`, `docs/test-spec.md`, `docs/implementation-plan.md`, `.omx/plans/prd-keyhint.md`, `.omx/plans/test-spec-keyhint.md`가 모두 존재하며 핵심 키워드(local memory, meaning-first, Unknown, trust-before-permission, raw text, source precedence)를 grep으로 확인했다.
- 커밋: `0a45ce2`


### 단계 2 — README quickstart와 permissionless mock HUD 계약

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` + DX 문서화
- 완료 보고: README에 5분 quickstart, 2분 permissionless mock HUD demo, 권한 caveat, developer command 계약, troubleshooting 링크를 작성했다.
- 검증 근거: `grep`으로 `5분 Quickstart`, `Permissionless Mock HUD Demo`, `hud:test --shortcut Command+P --app Cursor`, `권한 caveat`, `docs/troubleshooting.md`, `No raw text stored`, `keyhint doctor` 존재를 확인했다.
- 커밋: `5da72da`


### 단계 3 — Tauri v2 scaffold

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` + Tauri 공식 문서 확인
- 완료 보고: 공식 Tauri v2 create/develop/configuration 문서를 확인하고 Vanilla TypeScript + Tauri v2 scaffold를 생성했다.
- 검증 근거: `npm run check` 통과, `npm run build` 통과, `npm audit --audit-level=high` 통과, `cargo check --manifest-path src-tauri/Cargo.toml` 통과, scaffold 필수 파일과 `dev`/`tauri`/`tauri:dev`/`check`/`test`/`build` scripts 존재 확인.
- 참고 근거: Tauri v2 Create a Project, Develop, Configuration Files 공식 문서.
- 커밋: `548e16e`


### 단계 4 — Permissionless mock HUD demo

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` + frontend 구현
- 완료 보고: 권한 없이 Known, Unknown, Permission missing HUD 상태를 query string으로 볼 수 있는 mock HUD demo를 구현했다.
- 검증 근거: `npm run test:mock-hud` 통과, `npm run check` 통과, `npm run build` 통과, Vite dev server에서 세 mock URL 모두 HTTP 200 응답 확인.
- 커밋: `2bf088d`


### 단계 5 — Developer command 표면

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` + DX 구현
- 완료 보고: `npm run keyhint -- ...` 기반으로 `doctor`, `hud:test`, `permissions:check`, `maps:validate`, `diagnostics:redact` 명령을 구현했다.
- 검증 근거: `npm run doctor`, `npm run hud:test`, `npm run permissions:check`, `npm run maps:validate`, `npm run diagnostics:redact`, `npm run test`, `npm run build`, `npm audit --audit-level=high` 통과.
- 커밋: `836e931`


### 단계 6 — macOS event collector spike

- 상태: 완료
- 시작: 2026-06-16
- 완료: 2026-06-16
- 사용한 스킬/표면: `$ralph` + native spike + Apple 공식 문서 확인
- 완료 보고: 실제 CGEventTap 시작 없이 Input Monitoring/CGEventTap 가능성, Secure Input, IME/dead key, plain text 무시 정책을 Rust seam과 문서로 구현했다.
- 검증 근거: `npm run event:spike` 통과, `cargo test --manifest-path src-tauri/Cargo.toml event_collector` 통과, `npm run test` 통과, `npm run build` 통과, `npm audit --audit-level=high` 통과.
- 참고 근거: Apple Developer Quartz Event Services/CGEvent tap 문서, Apple Support Input Monitoring 문서.
- 커밋: `8962d9e`
