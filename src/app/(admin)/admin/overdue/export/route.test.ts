import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import type { OverdueRow } from '../data';

import {
  OVERDUE_EXPORT_COLUMNS,
  buildOverdueFilename,
  buildOverdueWorkbook,
} from './workbook';

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
