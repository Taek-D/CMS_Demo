import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

type RequiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ACCOUNT_ENCRYPTION_KEY: string;
  ADMIN_EMAIL: string;
};

type SmokeUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
};

const MORNING_STAR_CENTER_NAME = 'Morning Star Childcare';
const SUN_CLASS_ID = '11111111-aaaa-1111-aaaa-111111111111';
const SUN_CLASS_NAME = 'Sun Class';
const OVERDUE_CHILD_NAME = 'Phase 4 Overdue Child';
const BATCH_MONTH = '2026-04';
const BILLING_AMOUNT = 47000;
const FAIL_REASON = 'Insufficient funds';
const EXPECTED_DOWNLOAD_NAME =
  'overdue-statement-2026-04-morning-star-childcare-sun-class.xlsx';

const env = loadRequiredEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const adminProfile = {
  email: env.ADMIN_EMAIL,
  password: 'Phase4Admin!234',
  name: 'Phase 4 Smoke Admin',
  phone: '01090000001',
};

const overdueParentProfile = {
  email: 'phase4.overdue.parent@example.com',
  password: 'Phase4Parent!234',
  name: 'Phase 4 Overdue Parent',
  phone: '01022334455',
  accountHolder: 'Phase 4 Overdue Parent',
  accountNumber: '110123450987',
};

test('proves the results to overdue export journey', async ({ page }) => {
  test.setTimeout(180_000);

  await ensureUser(adminProfile);
  const parent = await ensureUser(overdueParentProfile);
  const seededBatchId = await seedFailedOverdueFlow(parent);

  await loginThroughRealForm(page, adminProfile.email, adminProfile.password);

  await page.goto(`/admin/results?batch_id=${seededBatchId}`);
  await expect(page).toHaveURL(
    new RegExp(`/admin/results\\?batch_id=${escapeRegExp(seededBatchId)}$`)
  );
  await expect(page.getByTestId('results-overdue-link')).toBeVisible();

  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === '/admin/overdue' &&
        url.searchParams.get('month') === BATCH_MONTH &&
        url.searchParams.get('status') === 'failed'
    ),
    page.getByTestId('results-overdue-link').click(),
  ]);

  await expect(page.getByTestId('admin-overdue-month-filter')).toHaveValue(
    BATCH_MONTH
  );
  await expect(page.getByTestId('admin-overdue-status-filter')).toHaveValue(
    'failed'
  );
  await expect(page.getByTestId('admin-overdue-export-hint')).toBeVisible();

  await page
    .getByTestId('admin-overdue-center-filter')
    .fill(MORNING_STAR_CENTER_NAME);
  await page.getByTestId('admin-overdue-class-filter').fill(SUN_CLASS_NAME);

  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === '/admin/overdue' &&
        url.searchParams.get('month') === BATCH_MONTH &&
        url.searchParams.get('status') === 'failed' &&
        url.searchParams.get('center') === MORNING_STAR_CENTER_NAME &&
        url.searchParams.get('class') === SUN_CLASS_NAME
    ),
    page.getByTestId('admin-overdue-submit').click(),
  ]);

  const overdueTable = page.getByTestId('admin-overdue-table');
  await expect(overdueTable).toContainText(overdueParentProfile.name);
  await expect(overdueTable).toContainText(OVERDUE_CHILD_NAME);
  await expect(overdueTable).toContainText(MORNING_STAR_CENTER_NAME);
  await expect(overdueTable).toContainText(SUN_CLASS_NAME);
  await expect(overdueTable).toContainText('47,000');
  await expect(overdueTable).toContainText(FAIL_REASON);

  const exportLink = page.getByTestId('admin-overdue-export-link');
  await expect(exportLink).toBeVisible();
  await expect(exportLink).toHaveAttribute('href', /\/admin\/overdue\/export\?/);

  const downloadPromise = page.waitForEvent('download');
  await exportLink.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(EXPECTED_DOWNLOAD_NAME);
});

function loadRequiredEnv(): RequiredEnv {
  const filePath = path.resolve(process.cwd(), '.env.local');
  const fileContents = readFileSync(filePath, 'utf8');
  const values = new Map<string, string>();

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/\s+#.*$/, '').trim();

    if (value) {
      values.set(key, value);
    }
  }

  const requiredKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ACCOUNT_ENCRYPTION_KEY',
    'ADMIN_EMAIL',
  ] as const;

  for (const key of requiredKeys) {
    if (!values.get(key)) {
      throw new Error(`Missing ${key} in .env.local`);
    }
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: values.get('NEXT_PUBLIC_SUPABASE_URL')!,
    SUPABASE_SERVICE_ROLE_KEY: values.get('SUPABASE_SERVICE_ROLE_KEY')!,
    ACCOUNT_ENCRYPTION_KEY: values.get('ACCOUNT_ENCRYPTION_KEY')!,
    ADMIN_EMAIL: values.get('ADMIN_EMAIL')!,
  };
}

async function ensureUser(profile: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<SmokeUser> {
  const existingUser = await findUserByEmail(profile.email);

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: profile.email,
      password: profile.password,
      email_confirm: true,
      user_metadata: {
        name: profile.name,
        phone: profile.phone,
      },
    });

    if (error) {
      throw error;
    }

    await upsertMemberProfile(existingUser.id, profile);

    return {
      id: existingUser.id,
      ...profile,
    };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: profile.email,
    password: profile.password,
    email_confirm: true,
    user_metadata: {
      name: profile.name,
      phone: profile.phone,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Unable to create auth user for ${profile.email}`);
  }

  await upsertMemberProfile(data.user.id, profile);

  return {
    id: data.user.id,
    ...profile,
  };
}

async function findUserByEmail(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    const matchedUser = users.find((user) => user.email === email);

    if (matchedUser) {
      return matchedUser;
    }

    if (!data.nextPage || users.length === 0) {
      return null;
    }

    page = data.nextPage;
  }
}

async function upsertMemberProfile(
  userId: string,
  profile: {
    email: string;
    name: string;
    phone: string;
  }
) {
  const { error } = await supabase.from('cms_members').upsert(
    {
      id: userId,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
    },
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw error;
  }
}

async function seedFailedOverdueFlow(parent: SmokeUser) {
  await resetParentOverdueState(parent.id);

  const batchId = await ensureBatchId(BATCH_MONTH);
  const accountId = await createConsentedBankAccount(parent.id);
  await createChild(parent.id);
  await createFailedBillingResult({
    batchId,
    memberId: parent.id,
    accountId,
  });

  return batchId;
}

async function resetParentOverdueState(parentId: string) {
  const { error: deleteChildrenError } = await supabase
    .from('cms_children')
    .delete()
    .eq('parent_member_id', parentId);

  if (deleteChildrenError) {
    throw deleteChildrenError;
  }

  const { error: deleteResultsError } = await supabase
    .from('cms_billing_results')
    .delete()
    .eq('member_id', parentId);

  if (deleteResultsError) {
    throw deleteResultsError;
  }

  const { error: deleteSchedulesError } = await supabase
    .from('cms_billing_schedules')
    .delete()
    .eq('member_id', parentId);

  if (deleteSchedulesError) {
    throw deleteSchedulesError;
  }

  const { error: deleteAccountsError } = await supabase
    .from('cms_bank_accounts')
    .delete()
    .eq('member_id', parentId);

  if (deleteAccountsError) {
    throw deleteAccountsError;
  }
}

async function ensureBatchId(batchMonth: string) {
  const { data: existingBatch, error: lookupError } = await supabase
    .from('cms_billing_batches')
    .select('id')
    .eq('batch_month', batchMonth)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingBatch?.id) {
    return existingBatch.id;
  }

  const { data: createdBatch, error: insertError } = await supabase
    .from('cms_billing_batches')
    .insert({
      batch_month: batchMonth,
      status: 'completed',
      total_count: 1,
      success_count: 0,
      fail_count: 1,
    })
    .select('id')
    .single();

  if (insertError || !createdBatch) {
    throw insertError ?? new Error('Unable to create overdue smoke batch');
  }

  return createdBatch.id;
}

async function createConsentedBankAccount(memberId: string) {
  const { data, error } = await supabase
    .from('cms_bank_accounts')
    .insert({
      member_id: memberId,
      bank_code: '004',
      account_number_enc: encryptAccount(overdueParentProfile.accountNumber),
      account_holder: overdueParentProfile.accountHolder,
      consent_status: 'consented',
      consented_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? new Error('Unable to create overdue smoke bank account');
  }

  return data.id;
}

async function createChild(parentMemberId: string) {
  const { error } = await supabase.from('cms_children').insert({
    parent_member_id: parentMemberId,
    class_id: SUN_CLASS_ID,
    name: OVERDUE_CHILD_NAME,
    birth_date: '2020-05-01',
  });

  if (error) {
    throw error;
  }
}

async function createFailedBillingResult(config: {
  batchId: string;
  memberId: string;
  accountId: string;
}) {
  const { error } = await supabase.from('cms_billing_results').insert({
    batch_id: config.batchId,
    member_id: config.memberId,
    account_id: config.accountId,
    amount: BILLING_AMOUNT,
    status: 'failed',
    fail_reason: FAIL_REASON,
    processed_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

function encryptAccount(accountNumber: string) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(env.ACCOUNT_ENCRYPTION_KEY, 'hex'),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(accountNumber, 'utf8'),
    cipher.final(),
  ]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

async function loginThroughRealForm(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.locator('button[type="submit"]').click(),
  ]);

  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.afterAll(async () => {
  await supabase.removeAllChannels();
});
