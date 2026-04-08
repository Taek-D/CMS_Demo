import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Browser, type Page } from '@playwright/test';
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

const MORNING_STAR_CENTER_ID = '11111111-1111-1111-1111-111111111111';
const MORNING_STAR_CENTER_NAME = '별꽃 어린이집';
const SUN_CLASS_NAME = '해님반';
const PARENT_CHILD_NAME = '3단계 스모크 아동';
const BATCH_MONTH = '2026-04';
const BILLING_AMOUNT = 45000;

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
  password: 'AdminSmoke!234',
  name: '3단계 스모크 관리자',
  phone: '01090000000',
};

const parentProfile = {
  email: 'phase3.parent.smoke@example.com',
  password: 'Phase3Parent!234',
  name: '3단계 스모크 보호자',
  phone: '01012345678',
  accountHolder: '3단계 스모크 보호자',
  accountNumber: '110123456789',
};

test('covers the Phase 3 member and admin regression journey', async ({
  browser,
}) => {
  test.setTimeout(180_000);

  await ensureDeterministicUsers();
  const parent = await ensureUser(parentProfile);
  await resetParentDomainState(parent);

  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();

  await loginThroughRealForm(
    memberPage,
    parentProfile.email,
    parentProfile.password
  );
  await verifyMemberRoutes(memberPage);
  await addChildFromChildrenPage(memberPage);

  await memberContext.close();

  await verifyAdminFilters(browser);
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

async function ensureDeterministicUsers() {
  await ensureUser(adminProfile);
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

async function resetParentDomainState(parent: SmokeUser) {
  const { error: deleteChildrenError } = await supabase
    .from('cms_children')
    .delete()
    .eq('parent_member_id', parent.id);

  if (deleteChildrenError) {
    throw deleteChildrenError;
  }

  const { error: deleteResultsError } = await supabase
    .from('cms_billing_results')
    .delete()
    .eq('member_id', parent.id);

  if (deleteResultsError) {
    throw deleteResultsError;
  }

  const { error: deleteSchedulesError } = await supabase
    .from('cms_billing_schedules')
    .delete()
    .eq('member_id', parent.id);

  if (deleteSchedulesError) {
    throw deleteSchedulesError;
  }

  const { error: deleteAccountsError } = await supabase
    .from('cms_bank_accounts')
    .delete()
    .eq('member_id', parent.id);

  if (deleteAccountsError) {
    throw deleteAccountsError;
  }

  const { data: existingBatch, error: batchLookupError } = await supabase
    .from('cms_billing_batches')
    .select('id')
    .eq('batch_month', BATCH_MONTH)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (batchLookupError) {
    throw batchLookupError;
  }

  let batchId = existingBatch?.id ?? null;

  if (!batchId) {
    const { data: createdBatch, error: batchInsertError } = await supabase
      .from('cms_billing_batches')
      .insert({
        batch_month: BATCH_MONTH,
        status: 'completed',
        total_count: 1,
        success_count: 1,
        fail_count: 0,
      })
      .select('id')
      .single();

    if (batchInsertError || !createdBatch) {
      throw batchInsertError ?? new Error('Unable to create smoke billing batch');
    }

    batchId = createdBatch.id;
  }

  if (!batchId) {
    throw new Error('Unable to provision billing batch for the smoke test');
  }

  const { data: account, error: accountInsertError } = await supabase
    .from('cms_bank_accounts')
    .insert({
      member_id: parent.id,
      bank_code: '004',
      account_number_enc: encryptAccount(parentProfile.accountNumber),
      account_holder: parentProfile.accountHolder,
      consent_status: 'consented',
      consented_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (accountInsertError || !account) {
    throw accountInsertError ?? new Error('Unable to seed bank account');
  }

  const { error: billingResultError } = await supabase
    .from('cms_billing_results')
    .insert({
      batch_id: batchId,
      member_id: parent.id,
      account_id: account.id,
      amount: BILLING_AMOUNT,
      status: 'success',
      fail_reason: null,
      processed_at: new Date().toISOString(),
    });

  if (billingResultError) {
    throw billingResultError;
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

  await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
}

async function verifyMemberRoutes(page: Page) {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('body')).toContainText(parentProfile.name);
  await expect(page.getByRole('link', { name: '자녀 관리', exact: true })).toBeVisible();

  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.locator('body')).toContainText(parentProfile.accountHolder);

  await page.goto('/consent');
  await expect(page).toHaveURL(/\/consent$/);
  await expect(page.getByTestId('consent-card')).toBeVisible();

  await page.goto('/payments');
  await expect(page).toHaveURL(/\/payments$/);
  await expect(page.locator('body')).toContainText(BATCH_MONTH);
  await expect(page.locator('body')).toContainText('45,000');
}

async function addChildFromChildrenPage(page: Page) {
  await page.goto('/children');
  await expect(page).toHaveURL(/\/children$/);
  await expect(page.getByTestId('child-form')).toBeVisible();
  await expect(page.getByTestId('child-list')).toContainText(
    '등록된 자녀가 아직 없습니다.'
  );

  await page.locator('#child-name').fill(PARENT_CHILD_NAME);
  await page.locator('#birth-date').fill('2020-05-01');
  await page.getByTestId('center-search').fill(MORNING_STAR_CENTER_NAME);
  await page.getByTestId(`center-select-${MORNING_STAR_CENTER_ID}`).click();
  await page.getByTestId('class-select').click();
  await page.getByText(SUN_CLASS_NAME, { exact: true }).click();

  await page.getByRole('button', { name: '자녀 등록' }).click();

  await expect(page.getByTestId('child-list')).toContainText(PARENT_CHILD_NAME);
  await expect(page.getByTestId('child-list')).toContainText(
    MORNING_STAR_CENTER_NAME
  );
  await expect(page.getByTestId('child-list')).toContainText(SUN_CLASS_NAME);
}

async function verifyAdminFilters(browser: Browser) {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await loginThroughRealForm(
    adminPage,
    adminProfile.email,
    adminProfile.password
  );

  await adminPage.goto('/admin/members');
  await expect(adminPage).toHaveURL(/\/admin\/members$/);
  await expectRelationshipRow(adminPage);

  await applyAdminFilter(adminPage, {
    testId: 'admin-parent-filter',
    queryKey: 'parent',
    value: parentProfile.email,
  });
  await applyAdminFilter(adminPage, {
    testId: 'admin-child-filter',
    queryKey: 'child',
    value: PARENT_CHILD_NAME,
  });
  await applyAdminFilter(adminPage, {
    testId: 'admin-center-filter',
    queryKey: 'center',
    value: MORNING_STAR_CENTER_NAME,
  });
  await applyAdminFilter(adminPage, {
    testId: 'admin-class-filter',
    queryKey: 'class',
    value: SUN_CLASS_NAME,
  });

  await adminContext.close();
}

async function applyAdminFilter(
  page: Page,
  config: {
    testId:
      | 'admin-parent-filter'
      | 'admin-child-filter'
      | 'admin-center-filter'
      | 'admin-class-filter';
    queryKey: 'parent' | 'child' | 'center' | 'class';
    value: string;
  }
) {
  await page.goto('/admin/members');

  await page.getByTestId('admin-parent-filter').fill('');
  await page.getByTestId('admin-child-filter').fill('');
  await page.getByTestId('admin-center-filter').fill('');
  await page.getByTestId('admin-class-filter').fill('');
  await page.getByTestId(config.testId).fill(config.value);

  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === '/admin/members' &&
        url.searchParams.get(config.queryKey) === config.value
    ),
    page.locator('button[type="submit"]').click(),
  ]);

  await expectRelationshipRow(page);
}

async function expectRelationshipRow(page: Page) {
  const relationshipRow = page
    .locator('tbody tr')
    .filter({ hasText: parentProfile.email })
    .first();

  await expect(relationshipRow).toContainText(parentProfile.name);
  await expect(relationshipRow).toContainText(parentProfile.email);
  await expect(relationshipRow).toContainText(PARENT_CHILD_NAME);
  await expect(relationshipRow).toContainText(MORNING_STAR_CENTER_NAME);
  await expect(relationshipRow).toContainText(SUN_CLASS_NAME);
}
