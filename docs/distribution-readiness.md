# KeyHint Distribution Readiness

작성일: 2026-06-16  
단계: 16 — 배포 준비 문서화

이 문서는 KeyHint for Mac을 internal alpha에서 signed/notarized GitHub Release로 올리기 전 필요한 non-code 준비 상태를 고정한다.

## Current readiness verdict

- Repo-local build/test readiness: READY
- Signed/notarized production release: NOT READY
- Reason: Developer ID signing, notarization, stapling, and manual macOS dogfood evidence are intentionally not executed in this run.

## Required release gates

| Gate | Command / Evidence | Status |
|---|---|---|
| TypeScript/Rust contract tests | `npm run test` | READY |
| Web build | `npm run build` | READY |
| Dependency audit | `npm audit --audit-level=high` | READY |
| Rust static analysis | `npm run lint:rust` | READY |
| Shortcut map schema | `npm run maps:validate` | READY |
| Tauri app build | `npm run tauri:build` | NOT_RUN |
| Developer ID signing | Keychain + Tauri signing config outside git | MANUAL_REQUIRED |
| Notarization | Apple notarytool credentials outside git | MANUAL_REQUIRED |
| Stapling | `xcrun stapler validate` on release artifact | MANUAL_REQUIRED |
| Clean macOS install | New user account install smoke | MANUAL_REQUIRED |
| Manual dogfood | `docs/qa-dogfood.md` matrix executed | MANUAL_REQUIRED |

## Signing and notarization checklist

- [ ] Apple Developer account available
- [ ] Developer ID Application certificate installed in Keychain
- [ ] signing identity configured outside repository
- [ ] Tauri signing/notarization secrets excluded from git
- [ ] hardened runtime policy reviewed
- [ ] notarization submitted with `notarytool`
- [ ] stapled artifact validated
- [ ] Gatekeeper launch verified on clean macOS account

## No-network checklist

- [ ] run the app in offline mode
- [ ] verify no telemetry or cloud sync is enabled by default
- [ ] inspect app/network monitor during HUD preview and Settings navigation
- [ ] diagnostics export contains redacted payloads only
- [ ] Unknown inbox writes only to local allowed path

## GitHub Release checklist

- [ ] tag format: `v0.1.0-alpha.N`
- [ ] attach signed `.dmg` or `.app.zip`
- [ ] include SHA-256 checksum
- [ ] include notarization/stapling evidence
- [ ] include privacy summary: local-only, no raw text/raw key stream
- [ ] include known limitations from `docs/qa-dogfood.md`
- [ ] link `docs/privacy.md`, `docs/troubleshooting.md`, `docs/release.md`

## Release notes skeleton

```markdown
# KeyHint for Mac v0.1.0-alpha.N

## What changed
- Meaning-first HUD preview
- Local Unknown inbox recovery
- Canonical shortcut map/source precedence schema
- Settings IA for Status, Privacy, HUD, Sources, Unknowns, Apps, Diagnostics

## Privacy
- Local-only by default
- No raw text or raw key stream stored
- Diagnostics payloads are redacted

## Verification
- npm run test
- npm run build
- npm audit --audit-level=high
- npm run lint:rust
- npm run maps:validate

## Known limitations
- Real shortcut capture requires Input Monitoring permission
- Manual fullscreen/Stage Manager/multi-display/secure input dogfood is required before public release
- Signed/notarized release artifacts are not produced by this repo-local run
```

## Rollback plan

- Keep previous signed artifact available.
- Do not run destructive local store migration without backup and dry-run output.
- If permission/capture regressions occur, disable collector and keep mock HUD/Settings available.

