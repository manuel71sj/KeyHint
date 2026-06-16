# RALPLAN-DR — Source Resolver and Local Store Schema

작성일: 2026-06-16  
범위: KeyHint 단계 9 — shortcut source resolver와 local store schema 확정  
실행 후속: `$ralph` 단일 소유 구현/검증

## Requirements Summary

단계 9는 KeyHint의 정확도와 Unknown 회수 루프의 핵심 계약을 고정한다.

필수 산출물:

- source precedence 코드/문서/테스트 계약
- `UnknownCandidate`, `UserOverride`, `ShortcutSource`/metadata schema
- migration dry-run 계약
- raw text 저장 금지와 diagnostics redaction 연계
- matcher가 resolved active app context 없이는 Unknown을 저장하지 않는 guard

관련 기존 파일:

- `docs/PRD.md`
- `docs/test-spec.md`
- `docs/implementation-plan.md`
- `src/keyhint/mockHud.ts`
- `src-tauri/src/native/active_app.rs`
- `src-tauri/src/native/event_collector.rs`
- `data/shortcut-maps/cursor.json`
- `scripts/keyhint.mjs`

## RALPLAN-DR Summary

### Principles

1. **User truth wins**: user override는 모든 seed/import/system guess보다 우선한다.
2. **Local-only memory**: local store는 shortcut metadata만 저장하고 raw text/raw key stream은 저장하지 않는다.
3. **Uncertain context means no storage**: active app context가 nil/stale/unavailable이면 UnknownCandidate 저장 금지.
4. **Schema is a product contract**: schema version, migration dry-run, conflict metadata가 없으면 memory layer가 아니다.
5. **Explainability over magic**: HUD/Settings는 source, confidence, conflict/stale 상태를 사용자가 이해할 수 있게 제공한다.

### Decision Drivers

1. Custom keybinding이 seed map보다 정확해야 한다.
2. Unknown inbox는 raw text 없이도 회수 가능해야 한다.
3. 이후 Rust/Tauri command와 TypeScript UI가 같은 schema contract를 공유해야 한다.

### Viable Options

#### Option A — TypeScript-first schema/resolver, Rust mirrors later

- Pros: 현재 frontend/CLI 테스트와 빠르게 통합 가능, stage 10 Unknown inbox 구현이 쉬움.
- Cons: native matcher가 Rust로 이동할 때 schema 이중화 위험.

#### Option B — Rust-first schema/resolver, TypeScript consumes command output

- Pros: native event/app context와 가까워 최종 제품 구조에 근접.
- Cons: stage 9에서 UI/CLI iteration이 느리고 JSON fixture 검증이 번거로움.

#### Option C — JSON schema only, 구현은 나중으로 연기

- Pros: 빠름.
- Cons: 단계 9 완료 기준인 “계약과 테스트 존재”를 약하게 만족하며 stage 10 구현에서 재작업 가능성이 큼.

### Decision

**Option A**를 선택한다. 단계 9에서는 TypeScript-first source resolver와 local store schema를 구현하고, Rust native boundary는 기존 active app/event policy가 제공하는 sanitized/context guard를 통해 연결한다. Rust mirror는 stage 10~13에서 실제 store/command가 필요해질 때 확장한다.

### Invalidation rationale

- Option B는 장기적으로 타당하지만 현재 stage 9 목표가 schema/source precedence와 Unknown loop의 빠른 테스트 고정이므로 과도하다.
- Option C는 “문서만 있는 schema”가 되어 local memory layer 핵심 리스크를 줄이지 못한다.

## Acceptance Criteria

1. `src/keyhint/sourceResolver.ts`가 source precedence를 구현한다.
2. `src/keyhint/localStoreSchema.ts`가 `UnknownCandidate`, `UserOverride`, `ShortcutSourceMetadata`, migration dry-run result type을 정의한다.
3. `scripts/verify-source-resolver.ts`가 다음을 검증한다.
   - user override > imported > menu introspection > official > seed > system > unknown
   - UnknownCandidate는 raw text를 포함하지 않는다.
   - active app context가 unresolved/stale이면 Unknown 저장 불가.
   - migration dry-run은 schema_version 변화를 실행 없이 보고한다.
4. `npm run test`가 source resolver/schema 테스트를 포함한다.
5. `docs/shortcut-maps.md`가 source precedence와 local store schema를 문서화한다.
6. `KEYHINT_RALPH_STEPS.md` 단계 9에 완료 보고/검증/커밋 해시가 남는다.

## Implementation Steps

1. TypeScript schema types 추가: `src/keyhint/localStoreSchema.ts`
2. Resolver 구현: `src/keyhint/sourceResolver.ts`
3. Fixture 확장: `data/shortcut-maps/cursor.json` 또는 별도 fixture
4. 검증 스크립트 추가: `scripts/verify-source-resolver.ts`
5. package scripts 추가: `test:source-resolver`
6. 문서 추가: `docs/shortcut-maps.md`
7. 전체 검증: `npm run test`, `npm run build`, `npm audit --audit-level=high`

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| TS/Rust schema drift | TS schema를 먼저 명확화하고 Rust mirror는 later stage에서 command contract로 생성 |
| raw text 유입 | type/fixture/test에서 rawText/rawKeyStream 키를 거부 |
| source conflict 불명확 | MatchResult에 conflict/stale metadata 포함 |
| unresolved app 저장 | active app guard helper를 source resolver 테스트에 포함 |
| migration이 실제 데이터를 손상 | stage 9는 dry-run only로 제한 |

## Verification Steps

```bash
npm run test:source-resolver
npm run test
npm run build
npm audit --audit-level=high
```

## ADR

- Decision: TypeScript-first source resolver/local store schema를 구현한다.
- Drivers: 빠른 테스트 고정, Unknown inbox 선행, raw-text-free local memory layer 계약.
- Alternatives considered: Rust-first, JSON-schema-only.
- Why chosen: 현재 scaffold/CLI/test 구조에 가장 빨리 결합되며 stage 10 구현 리스크를 줄인다.
- Consequences: Rust native matcher가 필요해질 때 schema mirror/command contract를 추가해야 한다.
- Follow-ups: stage 10 Unknown inbox, stage 13 property/fixture tests, stage 14 review.

## Available-Agent-Types Roster

- `architect`: schema/source precedence 설계 검토
- `critic`: 계획 품질/검증 기준 검토
- `executor`: 승인 후 TypeScript/schema/docs 구현
- `test-engineer`: 이후 stage 13에서 fixture/property 테스트 확장
- `verifier`: stage 14 최종 검증

## Follow-up Staffing Guidance

- `$ralph` fallback: 현재 사용자 요청이 Ralph 순차 진행이므로 승인 후 leader가 직접 구현한다.
- `$team` optional: stage 10~13에서 UI/store/test 병렬화가 필요할 때 executor/test-engineer를 분리한다.
- `$ultragoal` optional: 전체 16단계 장기 추적을 별도 durable goal로 승격할 때 사용한다.

## Architect Iteration 1 반영 사항

Architect verdict: `ITERATE`  
반영일: 2026-06-16

### 보강된 identity/freshness contract

- `UnknownCandidate.candidateId`: deterministic key. 입력은 `bundleId + canonicalShortcut + appVersion? + coarseTimestampBucket`를 안정 문자열로 만들고 SHA-256 또는 테스트 가능한 stable hash로 변환한다.
- `UserOverride.overrideId`: deterministic key. 입력은 `bundleId + canonicalShortcut`이다. 같은 앱/shortcut override는 하나의 row를 갱신한다.
- `coarseTimestampBucket`: privacy-preserving bucket. MVP 기본값은 1시간 단위 ISO hour bucket이며 exact timestamp는 저장하지 않는다.
- `freshnessWindowMs`: Rust active app guard의 250ms 기준을 TS schema에 상수로 노출한다. Rust native guard가 freshness 판단의 authoritative source이고, TS resolver/local store는 이 판단 결과를 소비한다.
- unresolved/no_active_app/stale_context/resolver_unavailable 상태에서는 `candidateId`를 만들지 않고 Unknown 저장도 하지 않는다.

### 보강된 migration dry-run contract

`MigrationDryRunResult`는 최소 필드를 갖는다.

```ts
{
  beforeVersion: number;
  afterVersion: number;
  wouldMigrate: boolean;
  recordCount: number;
  conflicts: Array<{ id: string; reason: string }>;
  destructive: false;
}
```

Stage 9 migration은 dry-run only이며 실제 데이터를 수정하지 않는다.

### 보강된 conflict/stale metadata shape

`MatchResult`는 다음 metadata를 포함한다.

- `source`: winning source
- `confidence`: verified/imported/seed/system/unknown 등 사용자 설명 가능한 confidence
- `conflicts`: losing candidates with source and meaning
- `stale`: boolean
- `staleReason?`: app version/map version/source age 등

### 보강된 redaction negative assertion

검증 스크립트는 다음을 직접 확인한다.

- UnknownCandidate JSON에 `rawText`, `rawKeyStream`, `password`, `imeText` 키가 없다.
- diagnostics redaction output에서 `rawText`와 `rawKeyStream`은 항상 `[REDACTED]`다.
- shortcut map entry는 `rawTextStored: false`를 요구한다.

### Revised acceptance criteria additions

7. `candidateId`/`overrideId` deterministic identity가 테스트된다.
8. `MigrationDryRunResult` 필드가 테스트된다.
9. redaction negative assertion이 source resolver/schema 테스트에 포함된다.
10. TS schema는 Rust active app freshness guard를 authoritative source로 문서화한다.
