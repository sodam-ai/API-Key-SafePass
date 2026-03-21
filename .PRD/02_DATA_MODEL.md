# API Key Vault -- 데이터 모델

> 이 문서는 앱에서 다루는 핵심 데이터의 구조를 정의합니다.
> 개발자가 아니어도 이해할 수 있는 "개념적 ERD"입니다.

---

## 전체 구조

```
[AppSetting]          (앱 설정 - 마스터 비밀번호 해시 등)

[Project] --1:N--> [ApiKey] --1:N--> [KeyAlert]
                      |
                      ├--N:N--> [Tag]        (태그 연결 테이블: ApiKeyTag)
                      |
                      ├--1:N--> [EnvMapping]  (.env 변수명 매핑)
                      |
                      └--1:N--> [UsageLog]    (사용 내역)

[BackupHistory]       (백업/복원 이력)
```

---

## 엔티티 상세

### AppSetting
앱 전체 설정을 저장하는 테이블. 마스터 비밀번호의 해시값 등.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | 1 | O |
| key | 설정 항목 이름 | master_password_hash | O |
| value | 설정 값 (암호화) | $argon2id$v=19$m=65536... | O |
| updated_at | 마지막 수정일 | 2026-03-20 | O |

### Project
키를 묶는 폴더 역할. "내 블로그", "쇼핑몰 프로젝트" 같은 분류.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | proj-abc123 | O |
| name | 프로젝트 이름 | 내 블로그 | O |
| description | 설명 메모 | Next.js 블로그 프로젝트 | X |
| color | 구분 색상 | #4A90D9 | X |
| created_at | 만든 날짜 | 2026-03-20 | O |
| updated_at | 수정 날짜 | 2026-03-20 | O |

### ApiKey
핵심 데이터. API 키를 암호화하여 저장.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | key-xyz789 | O |
| project_id | 소속 프로젝트 | proj-abc123 | O |
| name | 키 별칭 | OpenAI GPT-4 키 | O |
| encrypted_value | 암호화된 키값 | (AES-256 암호문) | O |
| provider | API 제공자 | OpenAI | X |
| memo | 메모 | 월 $20 플랜 키 | X |
| expires_at | 만료일 | 2026-12-31 | X |
| last_used_at | 마지막 사용일 | 2026-03-19 | X |
| validation_status | 유효성 상태 | valid / invalid / unknown | X |
| created_at | 등록일 | 2026-03-20 | O |
| updated_at | 수정일 | 2026-03-20 | O |

### Tag
키에 붙이는 라벨. #무료, #유료, #테스트 등.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | tag-001 | O |
| name | 태그 이름 | 무료 | O |
| color | 태그 색상 | #27AE60 | X |

### ApiKeyTag
키와 태그의 연결 테이블 (다대다 관계).

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| api_key_id | 키 ID | key-xyz789 | O |
| tag_id | 태그 ID | tag-001 | O |

### EnvMapping
.env 파일 생성 시 어떤 키를 어떤 변수명으로 넣을지 매핑.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | env-001 | O |
| project_id | 프로젝트 ID | proj-abc123 | O |
| api_key_id | 연결된 키 ID | key-xyz789 | O |
| variable_name | .env 변수명 | OPENAI_API_KEY | O |

### UsageLog
키 사용 내역 기록. 보안 감사 및 편의용.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | log-001 | O |
| api_key_id | 사용한 키 ID | key-xyz789 | O |
| action | 행동 종류 | copied / exported / validated | O |
| timestamp | 사용 시각 | 2026-03-20 14:30:00 | O |

### KeyAlert
키 만료/사용량 알림 설정.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | alert-001 | O |
| api_key_id | 대상 키 ID | key-xyz789 | O |
| alert_type | 알림 종류 | expiration / usage_limit | O |
| threshold | 기준값 | 7 (일) / 80 (%) | O |
| is_active | 활성 여부 | true | O |
| last_triggered | 마지막 알림 시각 | 2026-03-15 | X |

### BackupHistory
백업/복원 이력 관리.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | bak-001 | O |
| action | 백업/복원 | backup / restore | O |
| file_path | 파일 경로 | C:/Backups/vault-2026-03-20.enc | O |
| key_count | 포함된 키 수 | 42 | O |
| timestamp | 수행 시각 | 2026-03-20 15:00:00 | O |

---

## 관계 정리

- **Project** 1개에 여러 개의 **ApiKey**가 속함
- **ApiKey** 1개에 여러 개의 **Tag**가 붙을 수 있음 (다대다, ApiKeyTag로 연결)
- **ApiKey** 1개에 여러 개의 **EnvMapping**이 있을 수 있음 (프로젝트마다 다른 변수명)
- **ApiKey** 1개에 여러 개의 **UsageLog**가 쌓임
- **ApiKey** 1개에 여러 개의 **KeyAlert**를 설정 가능

---

## 왜 이 구조인가

- **확장성**: Phase 2에서 EnvMapping, UsageLog, BackupHistory가 추가되고, Phase 3에서 KeyAlert가 추가되어도 기존 테이블을 변경할 필요 없음
- **단순성**: 핵심은 Project → ApiKey 관계 하나. 나머지는 부가 테이블로 필요할 때만 추가
- **보안**: encrypted_value만 암호화하면 되므로, 검색/필터링에 필요한 name, provider, tag는 평문으로 빠르게 조회 가능

---

## [NEEDS CLARIFICATION]

- [ ] SQLite를 사용할 경우 DB 파일 위치 (AppData? 사용자 지정?)
- [ ] 암호화 키 저장 방식 (OS 키체인 활용 여부)
- [ ] UsageLog 보관 기간 (무제한? 90일?)
