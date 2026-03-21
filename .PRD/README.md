# API Key Vault -- 디자인 문서

> Show Me The PRD로 생성됨 (2026-03-20)

## 문서 구성

| 문서 | 내용 | 언제 읽나 |
|------|------|----------|
| [01_PRD.md](./01_PRD.md) | 뭘 만드는지, 누가 쓰는지, 핵심 기능 13개 | 프로젝트 시작 전 |
| [02_DATA_MODEL.md](./02_DATA_MODEL.md) | 데이터 구조 (9개 테이블) | DB 설계할 때 |
| [03_PHASES.md](./03_PHASES.md) | 3단계 개발 계획 | 개발 순서 정할 때 |
| [04_PROJECT_SPEC.md](./04_PROJECT_SPEC.md) | AI 규칙 (Tauri + React + TypeScript) | AI에게 코드 시킬 때마다 |

## 다음 단계

Phase 1을 시작하려면 [03_PHASES.md](./03_PHASES.md)의 "Phase 1 시작 프롬프트"를 복사해서 AI에게 붙여넣기 하세요.

## 미결 사항 종합

- [ ] 마스터 비밀번호 분실 시 복구 방법
- [ ] 암호화 키 파생 방식 (PBKDF2 vs Argon2)
- [ ] 로컬 데이터 저장 위치 (AppData? 사용자 지정?)
- [ ] SQLite DB 파일 위치
- [ ] 암호화 키의 OS 키체인 활용 여부
- [ ] UsageLog 보관 기간
- [ ] 다크모드/라이트모드 기본값
- [ ] Tauri v2 최신 안정 버전 확인
- [ ] Windows 코드 서명 인증서 필요 여부
- [ ] 자동 업데이트 기능 포함 여부
