import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateServiceClient } = vi.hoisted(() => ({
  mockCreateServiceClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mockCreateServiceClient,
}));

import {
  applyOverdueFilters,
  buildOverdueSelect,
  fetchOverdueRows,
  normalizeOverdueFilters,
  toOverdueRow,
} from './data';

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
