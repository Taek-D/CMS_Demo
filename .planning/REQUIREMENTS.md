# Requirements: CMS Auto-Debit Demo

**Defined:** 2026-04-06
**Core Value:** 회원과 관리자 모두가 자동이체 핵심 흐름을 실제에 가깝게, 끊김 없이 재현하고 검증할 수 있어야 한다.

## v1 Requirements

### Database Integrity

- [ ] **DB-01**: Supabase 원격 데이터베이스에 `003_fix_rls_and_constraints.sql`가 오류 없이 적용된다.
- [ ] **DB-02**: 회원 프로필 insert, 계좌 delete, 월별 배치 unique 제약이 실제 DB에서 유효하게 동작한다.

### Member Flows

- [ ] **MEM-01**: 신규 회원이 UI에서 회원가입을 완료하면 `cms_members` 프로필이 함께 생성된다.
- [ ] **MEM-02**: 회원이 등록된 계좌를 UI에서 삭제할 수 있다.

### Admin Flows

- [ ] **ADM-01**: 관리자만 배치 실행 API와 관리자 화면 데이터에 접근할 수 있다.
- [ ] **ADM-02**: 관리자가 UI에서 월별 배치를 실행하면 출금 결과가 생성되고 화면에서 확인된다.

### Verification

- [ ] **VER-01**: 회원가입, 계좌 삭제, 관리자 배치 실행의 실제 검증 결과가 문서화된다.
- [ ] **VER-02**: 검증 과정에서 남은 리스크와 후속 작업이 명확하게 정리된다.

## v2 Requirements

### Product Expansion

- **EXP-01**: 이메일 인증 및 비밀번호 재설정 흐름을 추가한다.
- **EXP-02**: CMS 웹훅/배치 결과를 더 실제 시스템에 가깝게 시뮬레이션한다.

## Out of Scope

| Feature | Reason |
|---------|--------|
| UI 리디자인 | 현재 milestone의 목적은 운영 안정화와 흐름 검증이다. |
| 신규 결제/청구 기능 추가 | 기존 자동이체 핵심 플로우 검증이 우선이다. |
| 모바일 앱/반응형 고도화 | 이번 범위는 웹 데모의 실제 동작 검증에 한정한다. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| MEM-01 | Phase 1 | Pending |
| MEM-02 | Phase 1 | Pending |
| ADM-01 | Phase 2 | Pending |
| ADM-02 | Phase 2 | Pending |
| VER-01 | Phase 2 | Pending |
| VER-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial milestone definition*
