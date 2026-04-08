import { createServiceClient } from '@/lib/supabase/server';
import type { BillingResult, BillingStatus } from '@/types/database';

export type OverdueSearchParams = {
  month?: string | string[];
  center?: string | string[];
  class?: string | string[];
  status?: string | string[];
  search?: string | string[];
};

export type OverdueFilters = {
  month: string;
  center: string;
  class: string;
  status: BillingStatus | 'all';
  search: string;
};

type QueryLike<T> = {
  eq(column: string, value: string): T;
  ilike(column: string, pattern: string): T;
};

type ChildcareCenterRecord = {
  id: string;
  name: string;
} | null;

type ChildcareClassRecord = {
  id: string;
  name: string;
  center: ChildcareCenterRecord;
} | null;

type ChildRecord = {
  id: string;
  name: string;
  class: ChildcareClassRecord;
};

type MemberRecord = {
  id: string;
  member_no: string;
  name: string;
  email: string;
  children: ChildRecord | ChildRecord[] | null;
};

type BatchRecord = {
  id: string;
  batch_month: string;
};

type OverdueResultRecord = BillingResult & {
  batch: BatchRecord | BatchRecord[] | null;
  member: MemberRecord | MemberRecord[] | null;
};

export type OverdueRow = {
  id: string;
  batchId: string;
  memberId: string;
  accountId: string;
  memberNo: string;
  parentName: string;
  parentEmail: string;
  childNames: string;
  centerNames: string;
  classNames: string;
  batchMonth: string;
  amount: number;
  status: BillingStatus;
  failReason: string;
  processedAt: string | null;
  createdAt: string;
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getFilterValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? '';
  }

  return value?.trim() ?? '';
}

export function normalizeOverdueFilters(params: OverdueSearchParams = {}): OverdueFilters {
  const status = getFilterValue(params.status);

  return {
    month: getFilterValue(params.month),
    center: getFilterValue(params.center),
    class: getFilterValue(params.class),
    status: status === 'pending' || status === 'success' || status === 'all' ? status : 'failed',
    search: getFilterValue(params.search),
  };
}

export function buildOverdueSelect(filters: Partial<OverdueFilters>) {
  const needsChildJoin = Boolean(filters.center || filters.class);
  const needsClassJoin = Boolean(filters.center || filters.class);
  const needsCenterJoin = Boolean(filters.center);

  const childJoin = needsChildJoin ? '!inner' : '';
  const classJoin = needsClassJoin ? '!inner' : '';
  const centerJoin = needsCenterJoin ? '!inner' : '';

  return `
    id,
    batch_id,
    member_id,
    account_id,
    amount,
    status,
    fail_reason,
    processed_at,
    created_at,
    batch:cms_billing_batches!inner (
      id,
      batch_month
    ),
    member:cms_members!inner (
      id,
      member_no,
      name,
      email,
      children:cms_children${childJoin} (
        id,
        name,
        class:cms_childcare_classes${classJoin} (
          id,
          name,
          center:cms_childcare_centers${centerJoin} (
            id,
            name
          )
        )
      )
    )
  `;
}

export function applyOverdueFilters<T extends QueryLike<T>>(query: T, filters: Partial<OverdueFilters>) {
  let nextQuery = query;

  if (filters.month) {
    nextQuery = nextQuery.eq('batch.batch_month', filters.month);
  }

  if (filters.status && filters.status !== 'all') {
    nextQuery = nextQuery.eq('status', filters.status);
  }

  if (filters.center) {
    nextQuery = nextQuery.ilike('member.children.class.center.name', `%${filters.center}%`);
  }

  if (filters.class) {
    nextQuery = nextQuery.ilike('member.children.class.name', `%${filters.class}%`);
  }

  return nextQuery;
}

export function joinUnique(values: Array<string | null | undefined>) {
  const uniqueValues = Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  );

  return uniqueValues.length > 0 ? uniqueValues.join(', ') : '-';
}

export function toOverdueRow(result: OverdueResultRecord): OverdueRow {
  const batch = asArray(result.batch)[0];
  const member = asArray(result.member)[0];
  const children = asArray(member?.children);

  return {
    id: result.id,
    batchId: result.batch_id,
    memberId: result.member_id,
    accountId: result.account_id,
    memberNo: member?.member_no ?? '-',
    parentName: member?.name ?? '-',
    parentEmail: member?.email ?? '-',
    childNames: joinUnique(children.map((child) => child.name)),
    centerNames: joinUnique(children.map((child) => child.class?.center?.name)),
    classNames: joinUnique(children.map((child) => child.class?.name)),
    batchMonth: batch?.batch_month ?? '-',
    amount: result.amount,
    status: result.status,
    failReason: result.fail_reason ?? '-',
    processedAt: result.processed_at,
    createdAt: result.created_at,
  };
}

function matchesSearch(row: OverdueRow, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const haystacks = [row.parentName, row.parentEmail, row.childNames];

  return haystacks.some((value) => value.toLowerCase().includes(normalizedSearch));
}

export async function fetchOverdueRows(params: OverdueSearchParams = {}) {
  const filters = normalizeOverdueFilters(params);
  const supabase = await createServiceClient();

  let query = supabase
    .from('cms_billing_results')
    .select(buildOverdueSelect(filters))
    .order('created_at', { ascending: false });

  query = applyOverdueFilters(query, filters);

  const { data } = (await query) as { data: OverdueResultRecord[] | null };
  const rows = (data ?? []).map(toOverdueRow);

  // Supabase relation filters on a billing-results root cannot express a clean
  // parent-or-child OR search without making the query brittle, so the final
  // trim happens after the scoped SQL filters above.
  return rows.filter((row) => matchesSearch(row, filters.search));
}
