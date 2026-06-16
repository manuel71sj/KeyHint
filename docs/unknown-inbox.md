# Local Unknown Inbox

작성일: 2026-06-16  
범위: KeyHint 단계 10

Unknown inbox는 KeyHint가 아직 의미를 모르는 shortcut을 **raw text 없이** 로컬에 보관하고, 사용자가 의미를 라벨링한 뒤 앱별 override로 승격하는 회수 루프다.

## Flow

1. **저장**: fresh/resolved active app context가 있는 shortcut만 `UnknownCandidate`로 저장한다.
2. **라벨**: 사용자가 의미를 입력하면 상태가 `labeled`가 된다.
3. **무시**: 노이즈 shortcut은 `ignored`가 된다.
4. **Import**: 라벨된 Unknown은 `UserOverride`로 승격되고 상태가 `imported`가 된다.

## Status model

- `new`: 아직 라벨링하지 않은 후보.
- `labeled`: 의미는 입력했지만 override로 승격하지 않은 후보.
- `ignored`: 사용자가 무시한 후보.
- `imported`: `UserOverride`로 승격한 후보.

Duplicate `candidateId`는 새 row를 만들지 않고 `seenCount`만 증가시킨다.

## CLI contract

기본 store path는 `.keyhint/unknown-inbox.json`이며 테스트/개발에서는 `KEYHINT_STORE_PATH`로 바꿀 수 있다.

```bash
npm run keyhint -- unknown:add --bundle-id com.todesktop.230313mzl4w4u92 --app Cursor --shortcut Command+Shift+X
npm run keyhint -- unknown:list
npm run keyhint -- unknown:label --id uc_xxxxxxxx --meaning "Run selected command"
npm run keyhint -- unknown:ignore --id uc_xxxxxxxx
npm run keyhint -- unknown:import --id uc_xxxxxxxx
```

## Privacy contract

- `rawTextStored`는 항상 `false`다.
- `rawText`, `rawKeyStream`, `password`, `imeText` 키를 저장하지 않는다.
- exact timestamp 대신 1시간 bucket만 저장한다.
- 네트워크 전송은 없다.

## Verification

```bash
npm run test:unknown-inbox
npm run test
npm run build
npm audit --audit-level=high
```
