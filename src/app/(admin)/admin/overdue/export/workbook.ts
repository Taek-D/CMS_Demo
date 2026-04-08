import ExcelJS from 'exceljs';

import type { OverdueRow } from '../data';

const REQUIRED_SCOPE_ERROR = 'month, center, and class are required for export.';

type ExportScope = {
  month: string;
  center: string;
  class: string;
};

type OverdueWorkbookColumn = {
  header: string;
  key: keyof OverdueWorkbookRow;
  width: number;
};

type OverdueWorkbookRow = {
  memberNo: string;
  parentName: string;
  childNames: string;
  centerNames: string;
  classNames: string;
  batchMonth: string;
  amount: number;
  status: string;
  failReason: string;
};

function slugifyScopePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assertExplicitScope(scope: ExportScope) {
  if (!scope.month.trim() || !scope.center.trim() || !scope.class.trim()) {
    throw new Error(REQUIRED_SCOPE_ERROR);
  }
}

function toWorkbookRow(row: OverdueRow): OverdueWorkbookRow {
  return {
    memberNo: row.memberNo,
    parentName: row.parentName,
    childNames: row.childNames,
    centerNames: row.centerNames,
    classNames: row.classNames,
    batchMonth: row.batchMonth,
    amount: row.amount,
    status: row.status,
    failReason: row.failReason,
  };
}

export const OVERDUE_EXPORT_COLUMNS: OverdueWorkbookColumn[] = [
  { header: 'Member No.', key: 'memberNo', width: 18 },
  { header: 'Parent', key: 'parentName', width: 20 },
  { header: 'Children', key: 'childNames', width: 28 },
  { header: 'Childcare Center', key: 'centerNames', width: 28 },
  { header: 'Class', key: 'classNames', width: 20 },
  { header: 'Batch Month', key: 'batchMonth', width: 14 },
  { header: 'Amount', key: 'amount', width: 14 },
  { header: 'Billing Status', key: 'status', width: 16 },
  { header: 'Fail Reason', key: 'failReason', width: 24 },
];

export async function buildOverdueWorkbook(rows: OverdueRow[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Overdue Statement');

  worksheet.columns = OVERDUE_EXPORT_COLUMNS;
  worksheet.addRows(rows.map(toWorkbookRow));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  const amountColumn = worksheet.getColumn('amount');
  amountColumn.numFmt = '#,##0';

  return workbook;
}

export function buildOverdueFilename(scope: ExportScope) {
  assertExplicitScope(scope);

  return `overdue-statement-${slugifyScopePart(scope.month)}-${slugifyScopePart(scope.center)}-${slugifyScopePart(scope.class)}.xlsx`;
}
