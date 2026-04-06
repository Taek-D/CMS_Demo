# Roadmap: CMS Auto-Debit Demo v1.0

**Milestone:** v1.0 Supabase Migration & Flow Verification
**Created:** 2026-04-06

## Proposed Roadmap

**2 phases** | **8 requirements mapped** | All covered

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Apply migration and validate member flows | Supabase 스키마/RLS 변경을 반영하고 회원 흐름이 실제로 동작하도록 만든다. | DB-01, DB-02, MEM-01, MEM-02 | 4 |
| 2 | Validate admin billing flow and close findings | 관리자 권한 경로와 배치 실행을 검증하고 결과를 정리한다. | ADM-01, ADM-02, VER-01, VER-02 | 4 |

## Phase Details

### Phase 1: Apply migration and validate member flows

**Goal:** 원격 Supabase에 migration을 적용하고 회원가입/계좌 삭제 흐름을 실환경 기준으로 검증한다.

**Requirements:** DB-01, DB-02, MEM-01, MEM-02

**Success criteria:**
1. `supabase db push` 또는 동등한 절차로 migration 003이 실제 프로젝트에 반영된다.
2. 신규 회원가입 시 auth user와 `cms_members` row가 모두 생성된다.
3. 계좌 삭제가 RLS에 막히지 않고 UI에서 정상 완료된다.
4. DB 제약/정책 반영 여부를 확인할 수 있는 증거가 남는다.

### Phase 2: Validate admin billing flow and close findings

**Goal:** 관리자 권한이 필요한 배치 실행 및 결과 확인 흐름을 실제 환경에서 검증하고 후속 이슈를 정리한다.

**Requirements:** ADM-01, ADM-02, VER-01, VER-02

**Success criteria:**
1. 관리자 인증 없이 배치 실행 API가 호출되지 않는다.
2. 관리자 계정으로 배치를 실행하면 결과 row와 집계가 생성된다.
3. 배치 결과가 관리자 화면에서 확인된다.
4. 검증 결과, 잔여 리스크, 다음 액션이 문서 또는 최종 보고에 정리된다.

## Next Step

`$gsd-discuss-phase 1`

또는 바로 실행을 이어가려면 현재 세션에서 Phase 1을 수행한다.

---
*Last updated: 2026-04-06 after creating milestone roadmap*
