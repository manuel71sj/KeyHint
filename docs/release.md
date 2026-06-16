# KeyHint Release Checklist

작성일: 2026-06-16  
대상: internal alpha → signed/notarized Mac app

## Pre-release gates

- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm audit --audit-level=high`
- [ ] Tauri build smoke test
- [ ] Input Monitoring permission copy reviewed
- [ ] Privacy contract reviewed
- [ ] Unknown inbox delete/export path reviewed
- [ ] Diagnostics redaction verified

## macOS distribution

- [ ] Developer ID certificate configured
- [ ] Tauri signing identity configured outside git
- [ ] Hardened runtime enabled when distribution build starts
- [ ] Notarization credentials stored outside repo
- [ ] Stapling verified on release artifact
- [ ] Fresh install on a clean macOS user account

## Manual QA matrix

- [ ] standard desktop HUD
- [ ] fullscreen Spaces HUD
- [ ] Stage Manager HUD
- [ ] multi-display active display placement
- [ ] remote desktop behavior
- [ ] reduced motion setting
- [ ] Input Monitoring grant/revoke/relaunch
- [ ] Secure Event Input pause
- [ ] IME composing/dead key suppression
- [ ] password field suppression
- [ ] 10x shortcut burst queue behavior

## No-network/default-local verification

- [ ] 앱 실행 중 외부 네트워크 요청 없음
- [ ] shortcut memory local path 확인
- [ ] Unknown inbox local path 확인
- [ ] diagnostics export에서 `rawText`/`rawKeyStream` payload는 `[REDACTED]`로만 표시

## Release notes template

```text
KeyHint for Mac <version>

What changed:
- Meaning-first HUD improvements
- Local Unknown inbox recovery
- Source precedence / override fixes

Privacy:
- Local-only by default
- No raw text or raw key stream stored
- Diagnostics are redacted

Known limitations:
- Input Monitoring permission required for real shortcut capture
- Native fullscreen overlay fallback may vary by macOS version
```

## Rollback

- keep previous signed artifact
- keep local store migration dry-run output
- never run destructive local store migration without explicit backup

