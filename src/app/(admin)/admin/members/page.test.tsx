import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const { mockRequireAdmin, mockCreateServiceClient, mockDecryptAccount, mockMaskAccount } = vi.hoisted(
  () => ({
    mockRequireAdmin: vi.fn(),
    mockCreateServiceClient: vi.fn(),
    mockDecryptAccount: vi.fn(),
    mockMaskAccount: vi.fn(),
  })
);

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mockCreateServiceClient,
}));

vi.mock('@/lib/crypto', () => ({
  decryptAccount: mockDecryptAccount,
  maskAccount: mockMaskAccount,
}));

import {
  default as MembersPage,
  applyMemberFilters,
  buildMembersSelect,
  type MemberFilters,
} from './page';

type QueryMock = {
  or: Mock<(filters: string) => QueryMock>;
  ilike: Mock<(column: string, pattern: string) => QueryMock>;
};

function createQueryMock(): QueryMock {
  const query: QueryMock = {
    or: vi.fn(),
    ilike: vi.fn(),
  };

  query.or.mockReturnValue(query);
  query.ilike.mockReturnValue(query);

  return query;
}

function createPageQuery(rows: unknown[]) {
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    ilike: vi.fn(),
    then: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.then.mockImplementation((onFulfilled: (value: { data: unknown[] }) => unknown) =>
    Promise.resolve({ data: rows }).then(onFulfilled)
  );

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ id: 'admin-member' });
  mockDecryptAccount.mockImplementation((value: string) => value);
  mockMaskAccount.mockImplementation((value: string) => `MASKED:${value}`);
});

describe('buildMembersSelect', () => {
  it('includes children, classes, centers, and existing bank-account data', () => {
    const select = buildMembersSelect({});

    expect(select).toContain('children:cms_children');
    expect(select).toContain('class:cms_childcare_classes');
    expect(select).toContain('center:cms_childcare_centers');
    expect(select).toContain('cms_bank_accounts');
    expect(select).toContain('consent_status');
  });

  it('uses inner joins only when related filters are active', () => {
    expect(buildMembersSelect({})).not.toContain('!inner');
    expect(buildMembersSelect({ child: '민지' })).toContain('children:cms_children!inner');
    expect(buildMembersSelect({ class: '해님' })).toContain('class:cms_childcare_classes!inner');
    expect(buildMembersSelect({ center: '별꽃' })).toContain('center:cms_childcare_centers!inner');
  });
});

describe('applyMemberFilters', () => {
  it('narrows members by child, center, and class relations', () => {
    const query = createQueryMock();

    applyMemberFilters(query, {
      child: '민지',
      center: '별꽃',
      class: '해님',
    });

    expect(query.ilike).toHaveBeenCalledWith('children.name', '%민지%');
    expect(query.ilike).toHaveBeenCalledWith('children.class.center.name', '%별꽃%');
    expect(query.ilike).toHaveBeenCalledWith('children.class.name', '%해님%');
  });

  it('keeps parent-name filtering alongside relation filters', () => {
    const query = createQueryMock();
    const filters: Partial<MemberFilters> = {
      parent: '김',
      child: '민지',
    };

    applyMemberFilters(query, filters);

    expect(query.or).toHaveBeenCalledWith('name.ilike.%김%,email.ilike.%김%');
    expect(query.ilike).toHaveBeenCalledWith('children.name', '%민지%');
  });
});

describe('MembersPage CRM rendering', () => {
  it('shows parent, child, center, and class filters on the admin page', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({ parent: '김', child: '민지', center: '별꽃', class: '해님' }),
    });
    const { container } = render(view);

    expect(container.querySelector('input[name="parent"]')).not.toBeNull();
    expect(container.querySelector('input[name="child"]')).not.toBeNull();
    expect(container.querySelector('input[name="center"]')).not.toBeNull();
    expect(container.querySelector('input[name="class"]')).not.toBeNull();
  });

  it('renders child, center, and class relationship values next to the account data', async () => {
    const query = createPageQuery([
      {
        id: 'member-1',
        member_no: 'MEM-001',
        name: '김학부모',
        email: 'kim@example.com',
        created_at: '2026-04-08T00:00:00.000Z',
        cms_bank_accounts: [
          {
            id: 'account-1',
            bank_code: '004',
            account_number_enc: '1111222233334444',
            account_holder: '김학부모',
            consent_status: 'consented',
            consented_at: '2026-04-08T00:00:00.000Z',
          },
        ],
        children: [
          {
            id: 'child-1',
            name: '민지',
            class: {
              id: 'class-1',
              name: '해님반',
              center: {
                id: 'center-1',
                name: '별꽃 어린이집',
              },
            },
          },
          {
            id: 'child-2',
            name: '지윤',
            class: {
              id: 'class-2',
              name: '달님반',
              center: {
                id: 'center-1',
                name: '별꽃 어린이집',
              },
            },
          },
        ],
      },
    ]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({}),
    });

    render(view);

    expect(screen.getByRole('columnheader', { name: '자녀 수' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '자녀 이름' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '어린이집' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '반' })).toBeTruthy();
    expect(screen.getByText('민지, 지윤')).toBeTruthy();
    expect(screen.getByText('별꽃 어린이집')).toBeTruthy();
    expect(screen.getByText('해님반, 달님반')).toBeTruthy();
    expect(screen.getByText('MASKED:1111222233334444')).toBeTruthy();
    expect(screen.getByText('동의 완료')).toBeTruthy();
  });

  it('keeps the empty-state message when no members match the filters', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({ parent: '아무개' }),
    });

    render(view);

    expect(screen.getByText('현재 필터에 맞는 회원이 없습니다.')).toBeTruthy();
  });
});
