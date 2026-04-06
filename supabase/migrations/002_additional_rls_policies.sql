-- CMS Auto-Debit Demo - RLS Policy 추가
-- Migration: 002_additional_rls_policies
-- Date: 2026-04-06

-- ============================================
-- cms_billing_schedules RLS
-- ============================================
alter table cms_billing_schedules enable row level security;

create policy "Members can view own billing schedules"
  on cms_billing_schedules for select
  using (auth.uid() = member_id);

create policy "Members can insert own billing schedules"
  on cms_billing_schedules for insert
  with check (auth.uid() = member_id);

create policy "Members can update own billing schedules"
  on cms_billing_schedules for update
  using (auth.uid() = member_id);

-- ============================================
-- cms_billing_batches RLS
-- 관리자(service_role)는 전체 접근, 일반 사용자는 읽기만 가능
-- ============================================
alter table cms_billing_batches enable row level security;

create policy "Anyone can view billing batches"
  on cms_billing_batches for select
  using (true);

-- ============================================
-- 관리자 전용 접근 정책 (service_role 사용 시 무시됨)
-- 일반 사용자의 배치/결과 수정/삭제 방지
-- ============================================

-- cms_billing_results는 이미 본인 레코드 읽기 정책 존재
-- 관리자(service_role)는 RLS 우회 가능

-- ============================================
-- 트리거: 배치 완료 시 결과 집계 자동 업데이트
-- ============================================
create or replace function update_batch_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update cms_billing_batches
    set 
      total_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id),
      success_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id and status = 'success'),
      fail_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id and status = 'failed')
    where id = NEW.batch_id;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    update cms_billing_batches
    set 
      total_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id),
      success_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id and status = 'success'),
      fail_count = (select count(*) from cms_billing_results where batch_id = NEW.batch_id and status = 'failed')
    where id = NEW.batch_id;
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger update_batch_counts_trigger
after insert or update on cms_billing_results
for each row execute function update_batch_counts();
