import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
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
        center: ['Morning Star Childcare'],
        class: ['Sun Class'],
        status: ['all'],
        search: ['Minji'],
      })
    ).toEqual({
      month: '2026-04',
      center: 'Morning Star Childcare',
      class: 'Sun Class',
      status: 'all',
      search: 'Minji',
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
      center: 'Morning Star Childcare',
      class: 'Sun Class',
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
      center: 'Morning Star Childcare',
      class: 'Sun Class',
    });

    expect(query.eq).toHaveBeenCalledWith('batch.batch_month', '2026-04');
    expect(query.eq).toHaveBeenCalledWith('status', 'failed');
    expect(query.ilike).toHaveBeenCalledWith(
      'member.children.class.center.name',
      '%Morning Star Childcare%'
    );
    expect(query.ilike).toHaveBeenCalledWith('member.children.class.name', '%Sun Class%');
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
      fail_reason: 'Insufficient funds',
      processed_at: '2026-04-08T00:00:00.000Z',
      created_at: '2026-04-08T00:00:00.000Z',
      batch: {
        id: 'batch-1',
        batch_month: '2026-04',
      },
      member: {
        id: 'member-1',
        member_no: 'MEM-001',
        name: 'Kim Parent',
        email: 'kim@example.com',
        children: [
          {
            id: 'child-1',
            name: 'Minji',
            class: {
              id: 'class-1',
              name: 'Sun Class',
              center: {
                id: 'center-1',
                name: 'Morning Star Childcare',
              },
            },
          },
          {
            id: 'child-2',
            name: 'Jiyoon',
            class: {
              id: 'class-2',
              name: 'Moon Class',
              center: {
                id: 'center-1',
                name: 'Morning Star Childcare',
              },
            },
          },
        ],
      },
    });

    expect(row.childNames).toBe('Minji, Jiyoon');
    expect(row.centerNames).toBe('Morning Star Childcare');
    expect(row.classNames).toBe('Sun Class, Moon Class');
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
        fail_reason: 'Insufficient funds',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-1',
          member_no: 'MEM-001',
          name: 'Kim Parent',
          email: 'kim@example.com',
          children: [
            {
              id: 'child-1',
              name: 'Minji',
              class: {
                id: 'class-1',
                name: 'Sun Class',
                center: {
                  id: 'center-1',
                  name: 'Morning Star Childcare',
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
        fail_reason: 'Insufficient funds',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-2',
          member_no: 'MEM-002',
          name: 'Park Parent',
          email: 'park@example.com',
          children: [
            {
              id: 'child-2',
              name: 'Jiyoon',
              class: {
                id: 'class-1',
                name: 'Sun Class',
                center: {
                  id: 'center-1',
                  name: 'Morning Star Childcare',
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
      center: 'Morning Star Childcare',
      class: 'Sun Class',
      search: 'Jiyoon',
    });

    expect(query.eq).toHaveBeenCalledWith('batch.batch_month', '2026-04');
    expect(query.eq).toHaveBeenCalledWith('status', 'failed');
    expect(query.ilike).toHaveBeenCalledWith(
      'member.children.class.center.name',
      '%Morning Star Childcare%'
    );
    expect(query.ilike).toHaveBeenCalledWith('member.children.class.name', '%Sun Class%');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.memberNo).toBe('MEM-002');
    expect(rows[0]?.childNames).toBe('Jiyoon');
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
      'Select month, childcare center, and class to enable statement export.'
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
        fail_reason: 'Insufficient funds',
        processed_at: '2026-04-08T00:00:00.000Z',
        created_at: '2026-04-08T00:00:00.000Z',
        batch: {
          id: 'batch-1',
          batch_month: '2026-04',
        },
        member: {
          id: 'member-1',
          member_no: 'MEM-001',
          name: 'Kim Parent',
          email: 'kim@example.com',
          children: [
            {
              id: 'child-1',
              name: 'Minji',
              class: {
                id: 'class-1',
                name: 'Sun Class',
                center: {
                  id: 'center-1',
                  name: 'Morning Star Childcare',
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
        center: 'Morning Star Childcare',
        class: 'Sun Class',
        status: 'failed',
        search: 'Minji',
      }),
    });

    render(view);

    expect(screen.getByTestId('admin-overdue-table')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Member No.' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Parent' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Children' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Childcare Center' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Class' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Batch Month' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Billing Status' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Fail Reason' })).toBeTruthy();
    expect(screen.getByText('MEM-001')).toBeTruthy();
    expect(screen.getByText('Kim Parent')).toBeTruthy();
    expect(screen.getByText('Minji')).toBeTruthy();
    expect(screen.getByText('Morning Star Childcare')).toBeTruthy();
    expect(screen.getByText('Sun Class')).toBeTruthy();
    expect(screen.getByText('55,000')).toBeTruthy();
    expect(screen.getAllByText('Failed')).toHaveLength(2);
    expect(screen.getByText('Insufficient funds')).toBeTruthy();
    expect(screen.getByTestId('admin-overdue-export-link').getAttribute('href')).toBe(
      '/admin/overdue/export?month=2026-04&center=Morning+Star+Childcare&class=Sun+Class&status=failed&search=Minji'
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

    expect(screen.getByText('No overdue rows match the current filters.')).toBeTruthy();
  });
});
