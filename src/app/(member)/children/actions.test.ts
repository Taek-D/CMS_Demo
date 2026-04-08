import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createChild,
  deleteChild,
  updateChild,
} from './actions';
import { loadChildManagementData } from './page';

const {
  mockRequireAuth,
  mockCreateClient,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockCreateClient: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

type TableMock = {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

function createMutationTableMock(result: { error: { message: string } | null }) {
  const table: TableMock = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };

  table.insert.mockResolvedValue(result);
  table.update.mockReturnValue(table);
  table.delete.mockReturnValue(table);
  table.select.mockReturnValue(table);
  table.eq.mockReturnValue(table);
  table.order.mockResolvedValue(result);

  return table;
}

function createReadableTableMock<T>(result: T[]) {
  const table: TableMock = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };

  table.select.mockReturnValue(table);
  table.eq.mockReturnValue(table);
  table.order.mockResolvedValue({ data: result, error: null });

  return table;
}

describe('child actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: 'parent-1' });
  });

  it('createChild persists parent_member_id from the authenticated member', async () => {
    const childrenTable = createMutationTableMock({ error: null });
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => childrenTable),
    });

    const formData = new FormData();
    formData.set('name', 'Minji');
    formData.set('class_id', 'class-1');
    formData.set('parent_member_id', 'forged-parent');

    const result = await createChild(formData);

    expect(result).toEqual({ success: true });
    expect(childrenTable.insert).toHaveBeenCalledWith({
      parent_member_id: 'parent-1',
      class_id: 'class-1',
      name: 'Minji',
      birth_date: null,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/children');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('updateChild only updates rows owned by the current member and revalidates member routes', async () => {
    const childrenTable = createMutationTableMock({ error: null });
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => childrenTable),
    });

    const formData = new FormData();
    formData.set('child_id', 'child-1');
    formData.set('name', 'Updated Name');
    formData.set('class_id', 'class-2');
    formData.set('parent_member_id', 'forged-parent');

    const result = await updateChild(formData);

    expect(result).toEqual({ success: true });
    expect(childrenTable.update).toHaveBeenCalledWith({
      name: 'Updated Name',
      class_id: 'class-2',
      birth_date: null,
    });
    expect(childrenTable.eq).toHaveBeenNthCalledWith(1, 'id', 'child-1');
    expect(childrenTable.eq).toHaveBeenNthCalledWith(2, 'parent_member_id', 'parent-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/children');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('deleteChild removes only the current member child row', async () => {
    const childrenTable = createMutationTableMock({ error: null });
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => childrenTable),
    });

    const formData = new FormData();
    formData.set('child_id', 'child-1');

    const result = await deleteChild(formData);

    expect(result).toEqual({ success: true });
    expect(childrenTable.delete).toHaveBeenCalledOnce();
    expect(childrenTable.eq).toHaveBeenNthCalledWith(1, 'id', 'child-1');
    expect(childrenTable.eq).toHaveBeenNthCalledWith(2, 'parent_member_id', 'parent-1');
  });
});

describe('loadChildManagementData', () => {
  it('loads the signed-in parent children plus center and class reference data', async () => {
    const children = [
      {
        id: 'child-1',
        parent_member_id: 'parent-1',
        class_id: 'class-1',
        name: '민지',
        birth_date: null,
        created_at: '2026-04-07T00:00:00Z',
        updated_at: '2026-04-07T00:00:00Z',
        cms_childcare_classes: {
          id: 'class-1',
          center_id: 'center-1',
          name: '해님반',
          created_at: '2026-04-07T00:00:00Z',
          cms_childcare_centers: {
            id: 'center-1',
            name: '별꽃 어린이집',
            created_at: '2026-04-07T00:00:00Z',
          },
        },
      },
    ];
    const centers = [
      {
        id: 'center-1',
        name: '별꽃 어린이집',
        created_at: '2026-04-07T00:00:00Z',
      },
    ];
    const classes = [
      {
        id: 'class-1',
        center_id: 'center-1',
        name: '해님반',
        created_at: '2026-04-07T00:00:00Z',
      },
    ];

    const childrenTable = createReadableTableMock(children);
    const centersTable = createReadableTableMock(centers);
    const classesTable = createReadableTableMock(classes);
    const from = vi
      .fn()
      .mockReturnValueOnce(childrenTable)
      .mockReturnValueOnce(centersTable)
      .mockReturnValueOnce(classesTable);

    const data = await loadChildManagementData({ from }, 'parent-1');

    expect(from).toHaveBeenNthCalledWith(1, 'cms_children');
    expect(from).toHaveBeenNthCalledWith(2, 'cms_childcare_centers');
    expect(from).toHaveBeenNthCalledWith(3, 'cms_childcare_classes');
    expect(childrenTable.eq).toHaveBeenCalledWith('parent_member_id', 'parent-1');
    expect(data).toEqual({ children, centers, classes });
  });
});
