import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDashboardChildrenSummary } from '../dashboard/page';
import { memberNavItems } from '../layout';
import ChildForm from './child-form';

const { mockRefresh, mockCreateChild, mockUpdateChild, mockDeleteChild } = vi.hoisted(
  () => ({
    mockRefresh: vi.fn(),
    mockCreateChild: vi.fn(),
    mockUpdateChild: vi.fn(),
    mockDeleteChild: vi.fn(),
  })
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('./actions', () => ({
  createChild: mockCreateChild,
  updateChild: mockUpdateChild,
  deleteChild: mockDeleteChild,
}));

const centers = [
  { id: 'center-1', name: '별꽃 어린이집', created_at: '2026-04-07T00:00:00Z' },
  { id: 'center-2', name: '강변 키즈 어린이집', created_at: '2026-04-07T00:00:00Z' },
];

const classes = [
  { id: 'class-1', center_id: 'center-1', name: '해님반', created_at: '2026-04-07T00:00:00Z' },
  { id: 'class-2', center_id: 'center-1', name: '달님반', created_at: '2026-04-07T00:00:00Z' },
  { id: 'class-3', center_id: 'center-2', name: '별님반', created_at: '2026-04-07T00:00:00Z' },
];

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

describe('ChildForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateChild.mockResolvedValue({ success: true });
    mockUpdateChild.mockResolvedValue({ success: true });
    mockDeleteChild.mockResolvedValue({ success: true });
  });

  it('narrows the visible center options when the search input changes', () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    fireEvent.change(screen.getByLabelText(/어린이집 검색/i), {
      target: { value: '강변' },
    });

    expect(
      screen.queryByRole('button', { name: /별꽃 어린이집/i })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /강변 키즈 어린이집/i })
    ).toBeTruthy();
  });

  it('enables the class selector after center selection and limits options to that center', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    const classTrigger = screen.getByTestId('class-select');
    expect(classTrigger.getAttribute('disabled')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /별꽃 어린이집/i }));

    expect(classTrigger.getAttribute('disabled')).toBeNull();
    fireEvent.click(classTrigger);

    expect((await screen.findAllByText('해님반')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('달님반').length).toBeGreaterThan(0);
    expect(screen.queryByText('별님반')).toBeNull();
  });

  it('preloads name, center, and class values when editing an existing child', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(
      (screen.getByLabelText(/자녀 이름/i) as HTMLInputElement).value
    ).toBe('민지');
    expect(
      screen.getByText(/선택한 어린이집: 별꽃 어린이집/i)
    ).toBeTruthy();
    expect(screen.getByTestId('class-select').textContent).toContain('해님반');

    fireEvent.change(screen.getByLabelText(/자녀 이름/i), {
      target: { value: 'Minseo' },
    });
    fireEvent.click(screen.getByRole('button', { name: '자녀 정보 저장' }));

    await waitFor(() => {
      expect(mockUpdateChild).toHaveBeenCalledOnce();
    });
  });

  it('wires create and delete controls to the child actions', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    fireEvent.change(screen.getByLabelText(/자녀 이름/i), {
      target: { value: 'Haneul' },
    });
    fireEvent.click(screen.getByRole('button', { name: /강변 키즈 어린이집/i }));
    fireEvent.click(screen.getByTestId('class-select'));
    fireEvent.click(await screen.findByText('별님반'));
    fireEvent.click(screen.getByRole('button', { name: '자녀 등록' }));

    await waitFor(() => {
      expect(mockCreateChild).toHaveBeenCalledOnce();
    });

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(mockDeleteChild).toHaveBeenCalledOnce();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('keeps /children discoverable from member navigation and dashboard summary helpers', () => {
    expect(memberNavItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/children' }),
      ])
    );
    expect(buildDashboardChildrenSummary(2)).toMatchObject({
      href: '/children',
      count: 2,
    });
  });
});
