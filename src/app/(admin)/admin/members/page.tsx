import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdmin } from '@/lib/admin-auth';
import { BANK_CODES } from '@/lib/constants';
import { decryptAccount, maskAccount } from '@/lib/crypto';
import { createServiceClient } from '@/lib/supabase/server';

export type MembersSearchParams = {
  search?: string | string[];
  parent?: string | string[];
  child?: string | string[];
  center?: string | string[];
  class?: string | string[];
};

export type MemberFilters = {
  parent: string;
  child: string;
  center: string;
  class: string;
};

type QueryLike<T> = {
  or(filters: string): T;
  ilike(column: string, pattern: string): T;
};

type AccountRecord = {
  id: string;
  bank_code: string;
  account_number_enc: string;
  account_holder: string;
  consent_status: string;
  consented_at: string | null;
  masked_account?: string;
};

type ChildClassRecord = {
  id: string;
  name: string;
  center: {
    id: string;
    name: string;
  } | null;
} | null;

type ChildRecord = {
  id: string;
  name: string;
  class: ChildClassRecord;
};

type MemberRecord = {
  id: string;
  member_no: string;
  name: string;
  email: string;
  created_at: string;
  cms_bank_accounts: AccountRecord | AccountRecord[] | null;
  children: ChildRecord | ChildRecord[] | null;
};

function asArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return [] as T[];
  }

  return Array.isArray(value) ? value : [value];
}

function getFilterValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? '';
  }

  return value?.trim() ?? '';
}

export function normalizeMemberFilters(params: MembersSearchParams): MemberFilters {
  const search = getFilterValue(params.search);

  return {
    parent: getFilterValue(params.parent) || search,
    child: getFilterValue(params.child),
    center: getFilterValue(params.center),
    class: getFilterValue(params.class),
  };
}

export function buildMembersSelect(filters: Partial<MemberFilters>) {
  const needsChildJoin = Boolean(filters.child || filters.center || filters.class);
  const needsClassJoin = Boolean(filters.center || filters.class);
  const needsCenterJoin = Boolean(filters.center);

  const childJoin = needsChildJoin ? '!inner' : '';
  const classJoin = needsClassJoin ? '!inner' : '';
  const centerJoin = needsCenterJoin ? '!inner' : '';

  return `
    id,
    member_no,
    name,
    email,
    created_at,
    cms_bank_accounts (
      id,
      bank_code,
      account_number_enc,
      account_holder,
      consent_status,
      consented_at
    ),
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
  `;
}

export function applyMemberFilters<T extends QueryLike<T>>(query: T, filters: Partial<MemberFilters>) {
  let nextQuery = query;

  if (filters.parent) {
    nextQuery = nextQuery.or(`name.ilike.%${filters.parent}%,email.ilike.%${filters.parent}%`);
  }

  if (filters.child) {
    nextQuery = nextQuery.ilike('children.name', `%${filters.child}%`);
  }

  if (filters.center) {
    nextQuery = nextQuery.ilike('children.class.center.name', `%${filters.center}%`);
  }

  if (filters.class) {
    nextQuery = nextQuery.ilike('children.class.name', `%${filters.class}%`);
  }

  return nextQuery;
}

function decorateMembers(members: MemberRecord[] | null) {
  if (!members) {
    return [];
  }

  return members.map((member) => ({
    ...member,
    cms_bank_accounts: asArray(member.cms_bank_accounts).map((account) => {
      try {
        return {
          ...account,
          masked_account: maskAccount(decryptAccount(account.account_number_enc)),
        };
      } catch {
        return {
          ...account,
          masked_account: '***',
        };
      }
    }),
    children: asArray(member.children),
  }));
}

function joinNames(values: Array<string | null | undefined>) {
  const uniqueValues = Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  );

  return uniqueValues.length > 0 ? uniqueValues.join(', ') : '-';
}

function getConsentBadge(status: string) {
  switch (status) {
    case 'consented':
      return <Badge className="bg-green-500">동의 완료</Badge>;
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-black">
          대기 중
        </Badge>
      );
    case 'revoked':
      return (
        <Badge variant="outline" className="bg-gray-500 text-white">
          철회됨
        </Badge>
      );
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<MembersSearchParams>;
}) {
  await requireAdmin();

  const supabase = await createServiceClient();
  const filters = normalizeMemberFilters(await searchParams);

  let query = supabase
    .from('cms_members')
    .select(buildMembersSelect(filters))
    .order('created_at', { ascending: false });

  query = applyMemberFilters(query, filters);

  const { data } = (await query) as { data: MemberRecord[] | null };
  const members = decorateMembers(data);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">회원 CRM</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              name="parent"
              aria-label="학부모"
              data-testid="admin-parent-filter"
              placeholder="학부모 이름 또는 이메일"
              defaultValue={filters.parent}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="child"
              aria-label="자녀"
              data-testid="admin-child-filter"
              placeholder="자녀 이름"
              defaultValue={filters.child}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="center"
              aria-label="어린이집"
              data-testid="admin-center-filter"
              placeholder="어린이집 이름"
              defaultValue={filters.center}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                name="class"
                aria-label="반"
                data-testid="admin-class-filter"
                placeholder="반 이름"
                defaultValue={filters.class}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                조회
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원번호</TableHead>
                <TableHead>학부모</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>자녀 수</TableHead>
                <TableHead>자녀 이름</TableHead>
                <TableHead>어린이집</TableHead>
                <TableHead>반</TableHead>
                <TableHead>은행</TableHead>
                <TableHead>마스킹 계좌</TableHead>
                <TableHead>예금주</TableHead>
                <TableHead>동의 상태</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const account = member.cms_bank_accounts[0];
                const childCount = member.children.length;
                const childNames = joinNames(member.children.map((child) => child.name));
                const centerNames = joinNames(
                  member.children.map((child) => child.class?.center?.name ?? null)
                );
                const classNames = joinNames(member.children.map((child) => child.class?.name ?? null));
                const bankName = account
                  ? BANK_CODES.find((bank) => bank.code === account.bank_code)?.name ?? account.bank_code
                  : '-';

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono">{member.member_no}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{childCount}</TableCell>
                    <TableCell>{childNames}</TableCell>
                    <TableCell>{centerNames}</TableCell>
                    <TableCell>{classNames}</TableCell>
                    <TableCell>{bankName}</TableCell>
                    <TableCell className="font-mono">{account?.masked_account ?? '-'}</TableCell>
                    <TableCell>{account?.account_holder ?? '-'}</TableCell>
                    <TableCell>
                      {account ? getConsentBadge(account.consent_status) : <Badge variant="outline">계좌 없음</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {members.length === 0 && (
            <div className="py-12 text-center text-gray-500">현재 필터에 맞는 회원이 없습니다.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
