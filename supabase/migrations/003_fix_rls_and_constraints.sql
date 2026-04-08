-- Fix missing user-facing RLS policies and enforce core billing integrity rules.

-- Allow a signed-in member to create their own profile row after auth signup.
create policy "Members can insert own record"
  on cms_members for insert
  with check (auth.uid() = id);

-- Allow a signed-in member to delete their own bank account.
create policy "Members can delete own bank accounts"
  on cms_bank_accounts for delete
  using (auth.uid() = member_id);

-- Enforce one bank account per member at the database layer.
alter table cms_bank_accounts
  add constraint cms_bank_accounts_member_id_key unique (member_id);

-- Prevent duplicate monthly billing batches even under concurrent requests.
alter table cms_billing_batches
  add constraint cms_billing_batches_batch_month_key unique (batch_month);

-- Guard key schedule and status values with database checks.
alter table cms_billing_schedules
  add constraint cms_billing_schedules_amount_check check (amount > 0),
  add constraint cms_billing_schedules_billing_day_check check (billing_day between 1 and 28);

alter table cms_bank_accounts
  add constraint cms_bank_accounts_consent_status_check
  check (consent_status in ('pending', 'consented', 'revoked'));

alter table cms_billing_batches
  add constraint cms_billing_batches_status_check
  check (status in ('pending', 'processing', 'completed'));

alter table cms_billing_results
  add constraint cms_billing_results_status_check
  check (status in ('pending', 'success', 'failed'));
