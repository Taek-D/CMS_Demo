# CMS Auto-Debit Demo

## What This Is

효성CMS 자동이체 흐름을 재현하는 Next.js + Supabase 데모 애플리케이션이다. 회원이 계좌를 등록하고 출금 동의를 완료한 뒤, 관리자가 월별 배치 출금을 실행하고 결과를 확인하는 흐름을 웹에서 검증할 수 있도록 만든다.

## Core Value

회원과 관리자 모두가 자동이체 핵심 흐름을 실제에 가깝게, 끊김 없이 재현하고 검증할 수 있어야 한다.

## Current Milestone: v1.0 Supabase Migration & Flow Verification

**Goal:** Supabase 스키마/권한 보강을 실제 데이터베이스에 반영하고, 핵심 사용자 및 관리자 플로우가 실환경에서도 끝까지 동작함을 검증한다.

**Target features:**
- Supabase migration 003을 원격 프로젝트에 반영한다.
- 회원가입, 계좌 삭제, 관리자 배치 실행 흐름을 실제 앱에서 검증한다.
- 검증 중 발견되는 운영 차단 이슈를 즉시 수정하고 기록한다.

## Requirements

### Validated

- [x] 회원은 이메일/비밀번호로 가입하고 로그인할 수 있다.
- [x] 회원은 자신의 계좌를 등록하고 출금 동의 상태를 관리할 수 있다.
- [x] 관리자는 회원 목록, 배치 실행, 출금 결과 화면을 사용할 수 있다.
- [x] 계좌번호는 암호화 저장 후 마스킹 표시된다.

### Active

- [ ] Supabase 권한/제약 migration이 원격 DB에 안전하게 반영된다.
- [ ] 회원가입 후 `cms_members` 생성, 계좌 삭제, 관리자 배치 실행이 실제 환경에서 검증된다.
- [ ] 검증 결과와 남은 리스크가 계획 문서에 반영된다.

### Out of Scope

- 이메일 인증, 비밀번호 재설정, 외부 결제 연동 고도화: 이번 마일스톤의 핵심은 흐름 안정화와 실검증이기 때문.
- UI 리디자인 및 신규 기능 추가: 현재는 운영 차단 이슈 해결과 검증 완료가 우선이기 때문.

## Context

- 애플리케이션 코드는 `src/app/**`, `src/lib/**`, `src/components/**`에 있으며, Supabase 스키마는 `supabase/migrations/*.sql`로 관리한다.
- 코드베이스 맵은 `.planning/codebase/`에 생성되어 있고, 현재 우선 이슈는 관리자 권한 경로, RLS 정책 누락, DB 무결성 제약, lint 안정화였다.
- 이번 작업으로 `supabase/migrations/003_fix_rls_and_constraints.sql`이 추가되었고, 서버/클라이언트 에러 처리와 관리자 데이터 접근도 함께 보강되었다.

## Constraints

- **Tech stack**: Next.js App Router, React 19, TypeScript, Supabase를 유지해야 함 - 기존 데모 구조를 보존해야 하기 때문.
- **Security**: 실제 Supabase 프로젝트에는 RLS와 service role 경계를 유지해야 함 - 관리자 검증 중에도 일반 사용자 권한이 우회되면 안 되기 때문.
- **Verification**: 핵심 흐름은 실제 원격 Supabase와 앱 UI 기준으로 확인해야 함 - 로컬 추정만으로는 운영 안정성을 보장할 수 없기 때문.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 관리자 확인 로직을 `getAdminAccess()`로 공통화 | 관리자용 route/API에서 인증과 권한 판별을 같은 기준으로 사용하기 위해 | Pending |
| DB 제약과 RLS 누락을 migration으로 보완 | UI 레벨 방어만으로는 중복 배치/삭제 실패/프로필 생성 실패를 막을 수 없기 때문에 | Pending |
| 이번 milestone은 연구를 생략하고 실검증 중심으로 진행 | 기능 탐색보다 현재 흐름의 동작 보장이 더 시급하기 때문에 | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after starting milestone v1.0 Supabase Migration & Flow Verification*
