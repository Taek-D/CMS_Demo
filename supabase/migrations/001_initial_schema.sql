-- CMS Auto-Debit Demo Database Schema
-- Migration: 001_initial_schema
-- Date: 2026-04-06

-- ============================================
-- cms_members (학부모 회원)
-- ============================================
create table cms_members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  member_no text unique, -- 고유 회원번호 (자동 생성)
  created_at timestamptz default now()
);

-- ============================================
-- cms_bank_accounts (계좌 정보)
-- ============================================
create table cms_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references cms_members(id) on delete cascade,
  bank_code text not null,        -- 은행 코드 (예: 004 = 국민은행)
  account_number_enc text not null, -- AES-256-CBC 암호화된 계좌번호
  account_holder text not null,   -- 예금주명
  consent_status text not null default 'pending',
    -- pending / consented / revoked
  consented_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- cms_billing_schedules (출금 스케줄)
-- ============================================
create table cms_billing_schedules (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references cms_members(id) on delete cascade,
  account_id uuid references cms_bank_accounts(id),
  amount integer not null,        -- 출금 금액 (원)
  billing_day integer not null,   -- 매월 출금일 (1~28)
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- cms_billing_batches (배치 회차)
-- ============================================
create table cms_billing_batches (
  id uuid primary key default gen_random_uuid(),
  batch_month text not null,      -- 예: '2026-04'
  status text not null default 'pending',
    -- pending / processing / completed
  total_count integer default 0,
  success_count integer default 0,
  fail_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- cms_billing_results (출금 결과)
-- ============================================
create table cms_billing_results (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references cms_billing_batches(id),
  member_id uuid references cms_members(id),
  account_id uuid references cms_bank_accounts(id),
  amount integer not null,
  status text not null default 'pending',
    -- pending / success / failed
  fail_reason text,               -- 실패 사유 (잔액부족, 계좌오류 등)
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- 고유 회원번호 자동 생성 트리거
-- ============================================
create or replace function generate_member_no()
returns trigger as $$
declare
  prefix text;
  seq_num integer;
  new_no text;
begin
  prefix := 'MEM-' || to_char(now(), 'YYYYMM') || '-';
  select count(*) + 1 into seq_num
  from cms_members
  where member_no like prefix || '%';
  new_no := prefix || lpad(seq_num::text, 5, '0');
  new.member_no := new_no;
  return new;
end;
$$ language plpgsql;

create trigger set_member_no
before insert on cms_members
for each row execute function generate_member_no();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- cms_members RLS
alter table cms_members enable row level security;

create policy "Members can view own record"
  on cms_members for select
  using (auth.uid() = id);

create policy "Members can update own record"
  on cms_members for update
  using (auth.uid() = id);

-- cms_bank_accounts RLS
alter table cms_bank_accounts enable row level security;

create policy "Members can view own bank accounts"
  on cms_bank_accounts for select
  using (auth.uid() = member_id);

create policy "Members can insert own bank accounts"
  on cms_bank_accounts for insert
  with check (auth.uid() = member_id);

create policy "Members can update own bank accounts"
  on cms_bank_accounts for update
  using (auth.uid() = member_id);

-- cms_billing_results RLS
alter table cms_billing_results enable row level security;

create policy "Members can view own billing results"
  on cms_billing_results for select
  using (auth.uid() = member_id);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================
create index idx_cms_bank_accounts_member_id on cms_bank_accounts(member_id);
create index idx_cms_billing_schedules_member_id on cms_billing_schedules(member_id);
create index idx_cms_billing_batches_month on cms_billing_batches(batch_month);
create index idx_cms_billing_results_batch_id on cms_billing_results(batch_id);
create index idx_cms_billing_results_member_id on cms_billing_results(member_id);
create index idx_cms_billing_results_status on cms_billing_results(status);
