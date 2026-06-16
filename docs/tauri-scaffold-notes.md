# Tauri scaffold notes

작성일: 2026-06-16

## 공식 문서 확인

- Tauri v2 Create a Project 문서는 `create-tauri-app`과 Vanilla TypeScript 템플릿을 시작점으로 제안한다.
- Tauri v2 Develop 문서는 desktop 개발 명령으로 `npm run tauri dev`를 안내한다.
- Tauri v2 Configuration Files 문서는 `tauri.conf.json`, `package.json`, `Cargo.toml`이 주요 설정 파일이라고 설명한다.

## 선택

이 저장소는 이미 README/TODOS/문서가 있으므로 interactive `create-tauri-app` 대신 공식 Vanilla TypeScript 구조를 수동 scaffold했다.

- frontend: Vite + TypeScript + vanilla DOM
- shell: Tauri v2 Rust entrypoint
- dev server: `127.0.0.1:1420`
- bundle: 단계 3에서는 `active: false`로 두고 release gate 단계에서 signed/notarized 정책과 함께 활성화한다.
