# Test Automation Coverage

작성일: 2026-06-16  
범위: KeyHint 단계 13

단계 13은 PRD/test-spec의 핵심 위험을 자동화 테스트로 고정한다.

## Covered risks

- Normalizer: modifier alias/symbol을 canonical shortcut으로 통일하고 modifier-less typing을 capture 대상에서 제외한다.
- Matcher: source precedence에서 `user_override`가 seed/system보다 우선한다.
- Queue: burst duplicate coalescing, max-depth drop, sensitive context pause를 검증한다.
- Permission: granted만 collector 시작 가능하고 denied/revoked/restart recovery action을 검증한다.
- Redaction: `rawText`, `rawKeyStream`, `password`, `imeText` payload가 diagnostics에서 제거된다.

## Commands

```bash
npm run test:automation-coverage
npm run test
npm run build
npm audit --audit-level=high
```

## Follow-up

Stage 14 review에서 이 테스트들이 release-critical claim을 충분히 방어하는지 검토한다. 실제 CGEventTap/manual QA는 Stage 15에서 별도 기록한다.
