import { describe, expect, it, vi } from 'vitest';

import {
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
