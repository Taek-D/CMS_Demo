import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const { mockCreateServiceClient, mockRequireAdmin } = vi.hoisted(() => ({
  mockCreateServiceClient: vi.fn(),
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mockCreateServiceClient,
}));

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

import {
  applyOverdueFilters,
  buildOverdueSelect,
  fetchOverdueRows,
  normalizeOverdueFilters,
  toOverdueRow,
} from './data';
import OverduePage from './page';

type QueryMock = {
  eq: Mock<(column: string, value: string) => QueryMock>;
  ilike: Mock<(column: string, pattern: string) => QueryMock>;
};

function createQueryMock(): QueryMock {
  const query: QueryMock = {
    eq: vi.fn(),
    ilike: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);

  return query;
}

function createPageQuery(rows: unknown[]) {
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    then: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.then.mockImplementation((onFulfilled: (value: { data: unknown[] }) => unknown) =>
    Promise.resolve({ data: rows }).then(onFulfilled)
  );

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ id: 'admin-member' });
});

describe('normalizeOverdueFilters', () => {
  it('defaults the overdue status to failed', () => {
    expect(normalizeOverdueFilters({})).toEqual({
      month: '',
      center: '',
      class: '',
      status: 'failed',
      search: '',
    });
  });

  it('normalizes string-array search params', () => {
    expect(
      normalizeOverdueFilters({
        month: ['2026-04'],
        center: ['별꽃 어린이집'],
        class: ['해님반'],
        status: ['all'],
        search: ['민지'],
      })
    ).toEqual({
      month: '2026-04',
      center: '별꽃 어린이집',
      class: '해님반',
      status: 'all',
      search: '민지',
    });
  });
});

describe('buildOverdueSelect', () => {
  it('keeps left joins when relation filters are inactive', () => {
    const select = buildOverdueSelect({});

    expect(select).toContain('member:cms_members!inner');
    expect(select).not.toContain('children:cms_children!inner');
    expect(select).not.toContain('class:cms_childcare_classes!inner');
    expect(select).not.toContain('center:cms_childcare_centers!inner');
  });

  it('uses conditional !inner joins when center or class filters are active', () => {
    const select = buildOverdueSelect({
      center: '별꽃 어린이집',
      class: '해님반',
    });

    expect(select).toContain('children:cms_children!inner');
    expect(select).toContain('class:cms_childcare_classes!inner');
    expect(select).toContain('center:cms_childcare_centers!inner');
  });
});

describe('applyOverdueFilters', () => {
  it('applies month, status, center, and class narrowing to the billing-results root query', () => {
    const query = createQueryMock();

    applyOverdueFilters(query, {
      month: '2026-04',
      status: 'failed',
      center: '별꽃 어린이집',
      class: '해님반',
    });

    expect(query.eq).toHaveBeenCalledWith('batch.batch_month', '2026-04');
    expect(query.eq).toHaveBeenCalledWith('status', 'failed');
    expect(query.ilike).toHaveBeenCalledWith(
      'member.children.class.center.name',
      '%별꽃 어린이집%'
    );
    expect(query.ilike).toHaveBeenCalledWith('member.children.class.name', '%해님반%');
  });

  it('skips billing-status SQL narrowing when all statuses are requested', () => {
    const query = createQueryMock();

    applyOverdueFilters(query, {
      status: 'all',
    });

    expect(query.eq).not.toHaveBeenCalledWith('status', 'all');
  });
});

describe('toOverdueRow', () => {
  it('keeps one billing-result row while aggregating related child, center, and class labels', () => {
    const row = toOverdueRow({
      id: 'result-1',
      batch_id: 'batch-1',
      member_id: 'member-1',
      account_id: 'account-1',
      amount: 55000,
      status: 'failed',
      fail_reason: '잔액 부족',
      processed_at: '2026-04-08T00:00:00.000Z',
      created_at: '2026-04-08T00:00:00.000Z',
      batch: {
        id: 'batch-1',
        batch_month: '2026-04',
      },
      member: {
        id: 'member-1',
        member_no: 'MEM-001',
        name: '김학부모',
        email: 'kim@example.com',
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
    });

    expect(row.childNames).toBe('민지, 지윤');
    expect(row.centerNames).toBe('별꽃 어린이집');
    expect(row.classNames).toBe('해님반, 달님반');
    expect(row.amount).toBe(55000);
    expect(row.id).toBe('result-1');
  });
});

describe('fetchOverdueRows', () => {
  it('keeps SQL scope on billing data and trims the final set with parent-or-child search', async () => {
    const query = createPageQuery([
      {
        id: 'result-1',
        batch_id: 'batch-1',
        member_id: 'member-1',
        account_id: 'account-1',
        amount: 55000,
        status: 'failed',
        fail_reason: '잔액 부족',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-1',
          member_no: 'MEM-001',
          name: '김학부모',
          email: 'kim@example.com',
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
          ],
        },
      },
      {
        id: 'result-2',
        batch_id: 'batch-1',
        member_id: 'member-2',
        account_id: 'account-2',
        amount: 61000,
        status: 'failed',
        fail_reason: '잔액 부족',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-2',
          member_no: 'MEM-002',
          name: '박학부모',
          email: 'park@example.com',
          children: [
            {
              id: 'child-2',
              name: '지윤',
              class: {
                id: 'class-1',
                name: '해님반',
                center: {
                  id: 'center-1',
                  name: '별꽃 어린이집',
                },
              },
            },
          ],
        },
      },
    ]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const rows = await fetchOverdueRows({
      month: '2026-04',
      center: '별꽃 어린이집',
      class: '해님반',
      search: '지윤',
    });

    expect(query.eq).toHaveBeenCalledWith('batch.batch_month', '2026-04');
    expect(query.eq).toHaveBeenCalledWith('status', 'failed');
    expect(query.ilike).toHaveBeenCalledWith(
      'member.children.class.center.name',
      '%별꽃 어린이집%'
    );
    expect(query.ilike).toHaveBeenCalledWith('member.children.class.name', '%해님반%');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.memberNo).toBe('MEM-002');
    expect(rows[0]?.childNames).toBe('지윤');
  });
});

describe('OverduePage', () => {
  it('shows the overdue filters with a failed default and keeps export gated until the scope is complete', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await OverduePage({
      searchParams: Promise.resolve({}),
    });

    render(view);

    expect(screen.getByTestId('admin-overdue-month-filter')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-center-filter')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-class-filter')).toBeTruthy();
    expect((screen.getByTestId('admin-overdue-status-filter') as HTMLSelectElement).value).toBe(
      'failed'
    );
    expect(screen.getByTestId('admin-overdue-search-filter')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-submit')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-export-hint').textContent).toContain(
      '월, 어린이집, 반을 모두 선택하면 거래명세표를 내려받을 수 있습니다.'
    );
    expect(screen.queryByTestId('admin-overdue-export-link')).toBeNull();
  });

  it('renders the overdue table columns and passes the current query string to the export route when scoped', async () => {
    const query = createPageQuery([
      {
        id: 'result-1',
        batch_id: 'batch-1',
        member_id: 'member-1',
        account_id: 'account-1',
        amount: 55000,
        status: 'failed',
        fail_reason: '잔액 부족',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-1',
          member_no: 'MEM-001',
          name: '김학부모',
          email: 'kim@example.com',
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
          ],
        },
      },
    ]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await OverduePage({
      searchParams: Promise.resolve({
        month: '2026-04',
        center: '별꽃 어린이집',
        class: '해님반',
        status: 'failed',
        search: '민지',
      }),
    });

    render(view);

    expect(screen.getByTestId('admin-overdue-table')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '회원번호' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '학부모' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '자녀' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '어린이집' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '반' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '배치 월' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '금액' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '결제 상태' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '실패 사유' })).toBeTruthy();
    expect(screen.getByText('MEM-001')).toBeTruthy();
    expect(screen.getByText('김학부모')).toBeTruthy();
    expect(screen.getByText('민지')).toBeTruthy();
    expect(screen.getByText('별꽃 어린이집')).toBeTruthy();
    expect(screen.getByText('해님반')).toBeTruthy();
    expect(screen.getByText('55,000')).toBeTruthy();
    expect(screen.getAllByText('실패')).toHaveLength(2);
    expect(screen.getByText('잔액 부족')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-export-link').getAttribute('href')).toBe(
      '/admin/overdue/export?month=2026-04&center=%EB%B3%84%EA%BD%83+%EC%96%B4%EB%A6%B0%EC%9D%B4%EC%A7%91&class=%ED%95%B4%EB%8B%98%EB%B0%98&status=failed&search=%EB%AF%BC%EC%A7%80'
    );
    expect(screen.queryByTestId('admin-overdue-export-hint')).toBeNull();
  });

  it('keeps the empty-state copy when no overdue rows match the filters', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await OverduePage({
      searchParams: Promise.resolve({
        month: '2026-04',
      }),
    });

    render(view);

    expect(screen.getByText('현재 필터에 맞는 미납 내역이 없습니다.')).toBeTruthy();
  });
});
