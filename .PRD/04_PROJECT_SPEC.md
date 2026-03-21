# API Key Vault -- 프로젝트 스펙

> AI가 코드를 짤 때 지켜야 할 규칙과 절대 하면 안 되는 것.
> 이 문서를 AI에게 항상 함께 공유하세요.

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Tauri v2 | 앱 크기 ~10MB, Rust 기반 보안 강력, 메모리 30MB |
| 프론트엔드 | React + TypeScript | AI 코딩 호환성 최고, 커뮤니티 크고, Tauri와 궁합 좋음 |
| 스타일링 | Tailwind CSS | 빠른 UI 개발, 다크모드 지원 내장 |
| 로컬 DB | SQLite (via Tauri SQL plugin) | 서버 불필요, 파일 하나로 관리, 100만 행도 빠름 |
| 암호화 | AES-256-GCM (Rust crypto) | 업계 표준 암호화, Rust 네이티브로 빠르고 안전 |
| 빌드 | Vite | Tauri 공식 권장, HMR 빠름 |

---

## 프로젝트 구조

```
api-key-vault/
├── src/                    # React 프론트엔드
│   ├── components/         # UI 컴포넌트
│   │   ├── Dashboard/      # 대시보드 화면
│   │   ├── KeyList/        # 키 목록/검색
│   │   ├── KeyForm/        # 키 등록/수정 폼
│   │   ├── ProjectSidebar/ # 프로젝트 사이드바
│   │   └── common/         # 공통 컴포넌트 (버튼, 모달 등)
│   ├── hooks/              # 커스텀 React 훅
│   ├── lib/                # 유틸리티, Tauri API 래퍼
│   ├── types/              # TypeScript 타입 정의
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── main.tsx            # 엔트리포인트
├── src-tauri/              # Rust 백엔드
│   ├── src/
│   │   ├── main.rs         # Tauri 앱 진입점
│   │   ├── commands/       # Tauri 커맨드 (프론트↔백 통신)
│   │   ├── crypto/         # 암호화/복호화 로직
│   │   ├── db/             # SQLite DB 연결 및 쿼리
│   │   └── models/         # 데이터 모델
│   ├── Cargo.toml          # Rust 의존성
│   └── tauri.conf.json     # Tauri 앱 설정
├── public/                 # 아이콘, 정적 파일
├── package.json            # Node.js 의존성
└── vite.config.ts          # Vite 설정
```

---

## 절대 하지 마 (DO NOT)

> AI에게 코드를 시킬 때 이 목록을 반드시 함께 공유하세요.

- [ ] API 키를 평문으로 저장하지 마 (반드시 AES-256-GCM 암호화)
- [ ] 마스터 비밀번호를 평문으로 저장하지 마 (Argon2 해시 사용)
- [ ] 암호화 키를 소스 코드에 하드코딩하지 마
- [ ] console.log로 키값을 출력하지 마
- [ ] 네트워크로 키를 전송하지 마 (Phase 3 검증 제외, 그때도 HTTPS 필수)
- [ ] 기존 DB 스키마를 임의로 변경하지 마 (마이그레이션 스크립트 작성)
- [ ] 테스트 없이 빌드하지 마
- [ ] 목업/하드코딩 데이터로 완성이라고 하지 마
- [ ] package.json 또는 Cargo.toml의 기존 의존성 버전을 변경하지 마
- [ ] 에러 메시지에 키값이나 암호화 관련 내부 정보를 노출하지 마

---

## 항상 해 (ALWAYS DO)

- [ ] 변경하기 전에 계획을 먼저 보여줘
- [ ] 키값은 항상 AES-256-GCM으로 암호화/복호화
- [ ] 마스터 비밀번호는 Argon2id로 해시
- [ ] 에러가 발생하면 사용자에게 친절한 한국어 메시지 표시
- [ ] 다크모드 기본, 라이트모드 전환 가능
- [ ] 키보드 단축키 (Ctrl+K 검색, Esc 닫기 등) 지원
- [ ] SQLite 쿼리는 파라미터 바인딩 사용 (SQL injection 방지)
- [ ] Tauri 커맨드는 입력값 검증 후 처리

---

## 테스트 방법

```bash
# 프론트엔드 개발 서버
npm run dev

# Tauri 앱 개발 모드 (프론트 + 백엔드 동시 실행)
npm run tauri dev

# 타입 체크
npx tsc --noEmit

# Rust 테스트
cd src-tauri && cargo test

# 프로덕션 빌드
npm run tauri build
```

---

## 배포 방법

Tauri v2 빌드 시 자동으로 플랫폼별 설치 파일 생성:
- **Windows**: `.msi` 또는 `.exe` (src-tauri/target/release/bundle/)
- **macOS**: `.dmg` (추후 지원 시)
- **Linux**: `.deb`, `.AppImage` (추후 지원 시)

GitHub Releases에 업로드하여 배포 가능.

---

## 환경변수

| 변수명 | 설명 | 비고 |
|--------|------|------|
| (없음) | 이 앱은 로컬 전용이라 외부 서비스 환경변수가 필요 없습니다 | Phase 3에서 API 검증 시 추가 가능 |

> 이 앱은 서버가 없는 로컬 전용 앱이므로 .env 파일이 필요하지 않습니다.
> 모든 설정은 SQLite DB의 AppSetting 테이블에 저장합니다.

---

## [NEEDS CLARIFICATION]

- [ ] Tauri v2 최신 안정 버전 확인 필요
- [ ] Windows 코드 서명 인증서 필요 여부 (배포 시)
- [ ] 자동 업데이트 기능 포함 여부 (Tauri updater 플러그인)
