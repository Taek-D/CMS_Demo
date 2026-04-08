import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OverdueRow } from '../data';
import * as workbookModule from './workbook';
import { GET } from './route';

import {
  OVERDUE_EXPORT_COLUMNS,
  buildOverdueFilename,
  buildOverdueWorkbook,
} from './workbook';

const routeMocks = vi.hoisted(() => ({
  getAdminAccess: vi.fn(),
  normalizeOverdueFilters: vi.fn(),
  fetchOverdueRows: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({
  getAdminAccess: routeMocks.getAdminAccess,
}));

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data')>();

  return {
    ...actual,
    normalizeOverdueFilters: routeMocks.normalizeOverdueFilters,
    fetchOverdueRows: routeMocks.fetchOverdueRows,
  };
});

const sampleRow: OverdueRow = {
  id: 'result-1',
  batchId: 'batch-1',
  memberId: 'member-1',
  accountId: 'account-1',
  memberNo: 'MEM-202604-00001',
  parentName: 'Kim Parent',
  parentEmail: 'parent@example.com',
  childNames: 'Han Child, Min Child',
  centerNames: 'Morning Star Childcare',
  classNames: 'Sun Class, Moon Class',
  batchMonth: '2026-04',
  amount: 120000,
  status: 'failed',
  failReason: 'Insufficient funds',
  processedAt: '2026-04-01T09:00:00.000Z',
  createdAt: '2026-04-01T09:00:00.000Z',
};

const scopedFilters = {
  month: '2026-04',
  center: 'Morning Star Childcare',
  class: 'Sun Class',
  status: 'failed',
  search: 'Kim',
};

beforeEach(() => {
  vi.clearAllMocks();
  routeMocks.getAdminAccess.mockResolvedValue({
    kind: 'ok',
    member: { id: 'admin-member' },
  });
  routeMocks.normalizeOverdueFilters.mockReturnValue(scopedFilters);
  routeMocks.fetchOverdueRows.mockResolvedValue([sampleRow]);
});

describe('GET /admin/overdue/export workbook contract', () => {
  it('writes the planned XLSX header row order', async () => {
    const workbook = await buildOverdueWorkbook([sampleRow]);
    const buffer = await workbook.xlsx.writeBuffer();
    const loadedWorkbook = new ExcelJS.Workbook();

    await loadedWorkbook.xlsx.load(buffer);

    const worksheet = loadedWorkbook.getWorksheet('Overdue Statement');
    const headerRow = worksheet?.getRow(1).values;

    expect(headerRow).toEqual([
      undefined,
      ...OVERDUE_EXPORT_COLUMNS.map((column) => column.header),
    ]);
  });

  it('keeps one aggregated billing result as one worksheet row', async () => {
    const workbook = await buildOverdueWorkbook([sampleRow]);
    const buffer = await workbook.xlsx.writeBuffer();
    const loadedWorkbook = new ExcelJS.Workbook();

    await loadedWorkbook.xlsx.load(buffer);

    const worksheet = loadedWorkbook.getWorksheet('Overdue Statement');

    expect(worksheet?.rowCount).toBe(2);
    expect(worksheet?.getRow(2).values).toEqual([
      undefined,
      'MEM-202604-00001',
      'Kim Parent',
      'Han Child, Min Child',
      'Morning Star Childcare',
      'Sun Class, Moon Class',
      '2026-04',
      120000,
      'failed',
      'Insufficient funds',
    ]);
  });

  it('builds the scoped filename contract', () => {
    expect(
      buildOverdueFilename({
        month: '2026-04',
        center: 'Morning Star Childcare',
        class: 'Sun Class',
      })
    ).toBe('overdue-statement-2026-04-morning-star-childcare-sun-class.xlsx');
  });

  it('documents that month, center, and class are required for export.', () => {
    expect(() =>
      buildOverdueFilename({
        month: '2026-04',
        center: '',
        class: 'Sun Class',
      })
    ).toThrowError('month, center, and class are required for export.');
  });
});

describe('GET /admin/overdue/export', () => {
  it('returns 401 JSON when admin access is unauthenticated', async () => {
    routeMocks.getAdminAccess.mockResolvedValueOnce({ kind: 'unauthenticated' });

    const response = await GET(new Request('https://example.com/admin/overdue/export'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Admin access is required.',
    });
  });

  it('returns 403 JSON when admin access is forbidden', async () => {
    routeMocks.getAdminAccess.mockResolvedValueOnce({ kind: 'forbidden' });

    const response = await GET(new Request('https://example.com/admin/overdue/export'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Admin access is required.',
    });
  });

  it('returns status: 400 and skips the data fetch when explicit scope is missing', async () => {
    routeMocks.normalizeOverdueFilters.mockReturnValueOnce({
      ...scopedFilters,
      center: '',
    });

    const response = await GET(
      new Request('https://example.com/admin/overdue/export?month=2026-04&class=Sun+Class')
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'month, center, and class are required for export.',
    });
    expect(routeMocks.fetchOverdueRows).not.toHaveBeenCalled();
  });

  it('reuses the overdue page filters and returns an XLSX attachment', async () => {
    const workbookSpy = vi.spyOn(workbookModule, 'buildOverdueWorkbook');

    const response = await GET(
      new Request(
        'https://example.com/admin/overdue/export?month=2026-04&center=Morning+Star+Childcare&class=Sun+Class&status=failed&search=Kim'
      )
    );

    expect(routeMocks.normalizeOverdueFilters).toHaveBeenCalledWith({
      month: ['2026-04'],
      center: ['Morning Star Childcare'],
      class: ['Sun Class'],
      status: ['failed'],
      search: ['Kim'],
    });
    expect(routeMocks.fetchOverdueRows).toHaveBeenCalledWith({
      month: ['2026-04'],
      center: ['Morning Star Childcare'],
      class: ['Sun Class'],
      status: ['failed'],
      search: ['Kim'],
    });
    expect(workbookSpy).toHaveBeenCalledWith([sampleRow]);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="overdue-statement-2026-04-morning-star-childcare-sun-class.xlsx"'
    );

    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet('Overdue Statement');

    expect(worksheet?.getRow(2).getCell(1).value).toBe('MEM-202604-00001');
    expect(worksheet?.getRow(2).getCell(4).value).toBe('Morning Star Childcare');
  });
});
