import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  type MembersSearchParams,
} from './page';

type QueryMock = {
  or: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
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
    expect(buildMembersSelect({ child: 'Minji' })).toContain('children:cms_children!inner');
    expect(buildMembersSelect({ class: 'Sun' })).toContain('class:cms_childcare_classes!inner');
    expect(buildMembersSelect({ center: 'Morning' })).toContain('center:cms_childcare_centers!inner');
  });
});

describe('applyMemberFilters', () => {
  it('narrows members by child, center, and class relations', () => {
    const query = createQueryMock();

    applyMemberFilters(query, {
      child: 'Minji',
      center: 'Morning Star',
      class: 'Sun',
    });

    expect(query.ilike).toHaveBeenCalledWith('children.name', '%Minji%');
    expect(query.ilike).toHaveBeenCalledWith('children.class.center.name', '%Morning Star%');
    expect(query.ilike).toHaveBeenCalledWith('children.class.name', '%Sun%');
  });

  it('keeps parent-name filtering alongside relation filters', () => {
    const query = createQueryMock();
    const filters: MembersSearchParams = {
      parent: 'Kim',
      child: 'Minji',
    };

    applyMemberFilters(query, filters);

    expect(query.or).toHaveBeenCalledWith('name.ilike.%Kim%,email.ilike.%Kim%');
    expect(query.ilike).toHaveBeenCalledWith('children.name', '%Minji%');
  });
});

describe('MembersPage CRM rendering', () => {
  it('shows parent, child, center, and class filters on the admin page', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({ parent: 'Kim', child: 'Minji', center: 'Morning', class: 'Sun' }),
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
        name: 'Kim Parent',
        email: 'kim@example.com',
        created_at: '2026-04-08T00:00:00.000Z',
        cms_bank_accounts: [
          {
            id: 'account-1',
            bank_code: '004',
            account_number_enc: '1111222233334444',
            account_holder: 'Kim Parent',
            consent_status: 'consented',
            consented_at: '2026-04-08T00:00:00.000Z',
          },
        ],
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
    ]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({}),
    });

    render(view);

    expect(screen.getByRole('columnheader', { name: 'Child Count' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Children' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Centers' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Classes' })).toBeTruthy();
    expect(screen.getByText('Minji, Jiyoon')).toBeTruthy();
    expect(screen.getByText('Morning Star Childcare')).toBeTruthy();
    expect(screen.getByText('Sun Class, Moon Class')).toBeTruthy();
    expect(screen.getByText('MASKED:1111222233334444')).toBeTruthy();
    expect(screen.getByText('Consented')).toBeTruthy();
  });

  it('keeps the empty-state message when no members match the filters', async () => {
    const query = createPageQuery([]);

    mockCreateServiceClient.mockResolvedValue({
      from: vi.fn(() => query),
    });

    const view = await MembersPage({
      searchParams: Promise.resolve({ parent: 'Nobody' }),
    });

    render(view);

    expect(screen.getByText('No members match the current filters.')).toBeTruthy();
  });
});
