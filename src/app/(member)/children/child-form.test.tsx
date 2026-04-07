import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChildForm from './child-form';
import { memberNavItems } from '../layout';
import { buildDashboardChildrenSummary } from '../dashboard/page';

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
  { id: 'center-1', name: 'Morning Star Childcare', created_at: '2026-04-07T00:00:00Z' },
  { id: 'center-2', name: 'River Kids Center', created_at: '2026-04-07T00:00:00Z' },
];

const classes = [
  { id: 'class-1', center_id: 'center-1', name: 'Sun Class', created_at: '2026-04-07T00:00:00Z' },
  { id: 'class-2', center_id: 'center-1', name: 'Moon Class', created_at: '2026-04-07T00:00:00Z' },
  { id: 'class-3', center_id: 'center-2', name: 'Star Class', created_at: '2026-04-07T00:00:00Z' },
];

const children = [
  {
    id: 'child-1',
    parent_member_id: 'parent-1',
    class_id: 'class-1',
    name: 'Minji',
    birth_date: null,
    created_at: '2026-04-07T00:00:00Z',
    updated_at: '2026-04-07T00:00:00Z',
    cms_childcare_classes: {
      id: 'class-1',
      center_id: 'center-1',
      name: 'Sun Class',
      created_at: '2026-04-07T00:00:00Z',
      cms_childcare_centers: {
        id: 'center-1',
        name: 'Morning Star Childcare',
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

    fireEvent.change(screen.getByLabelText(/search center/i), {
      target: { value: 'river' },
    });

    expect(
      screen.queryByRole('button', { name: /morning star childcare/i })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /river kids center/i })
    ).toBeTruthy();
  });

  it('enables the class selector after center selection and limits options to that center', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    const classTrigger = screen.getByTestId('class-select-trigger');
    expect(classTrigger.getAttribute('disabled')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /morning star childcare/i }));

    expect(classTrigger.getAttribute('disabled')).toBeNull();
    fireEvent.click(classTrigger);

    expect((await screen.findAllByText('Sun Class')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Moon Class').length).toBeGreaterThan(0);
    expect(screen.queryByText('Star Class')).toBeNull();
  });

  it('preloads name, center, and class values when editing an existing child', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit minji/i }));

    expect(
      (screen.getByLabelText(/child name/i) as HTMLInputElement).value
    ).toBe('Minji');
    expect(
      screen.getByText(/selected center: morning star childcare/i)
    ).toBeTruthy();
    expect(screen.getByTestId('class-select-trigger').textContent).toContain(
      'Sun Class'
    );

    fireEvent.change(screen.getByLabelText(/child name/i), {
      target: { value: 'Minseo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save child/i }));

    await waitFor(() => {
      expect(mockUpdateChild).toHaveBeenCalledOnce();
    });
  });

  it('wires create and delete controls to the child actions', async () => {
    render(
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    );

    fireEvent.change(screen.getByLabelText(/child name/i), {
      target: { value: 'Haneul' },
    });
    fireEvent.click(screen.getByRole('button', { name: /river kids center/i }));
    fireEvent.click(screen.getByTestId('class-select-trigger'));
    fireEvent.click(await screen.findByText('Star Class'));
    fireEvent.click(screen.getByRole('button', { name: /add child/i }));

    await waitFor(() => {
      expect(mockCreateChild).toHaveBeenCalledOnce();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove minji/i }));

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
