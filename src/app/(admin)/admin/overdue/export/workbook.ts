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
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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
    status: row.status === 'failed' ? '실패' : row.status === 'success' ? '성공' : row.status === 'pending' ? '대기 중' : row.status,
    failReason: row.failReason,
  };
}

export const OVERDUE_EXPORT_COLUMNS: OverdueWorkbookColumn[] = [
  { header: '회원번호', key: 'memberNo', width: 18 },
  { header: '학부모', key: 'parentName', width: 20 },
  { header: '자녀', key: 'childNames', width: 28 },
  { header: '어린이집', key: 'centerNames', width: 28 },
  { header: '반', key: 'classNames', width: 20 },
  { header: '배치 월', key: 'batchMonth', width: 14 },
  { header: '금액', key: 'amount', width: 14 },
  { header: '결제 상태', key: 'status', width: 16 },
  { header: '실패 사유', key: 'failReason', width: 24 },
];

export async function buildOverdueWorkbook(rows: OverdueRow[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('미납 명세표');

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

  return `미납명세표-${slugifyScopePart(scope.month)}-${slugifyScopePart(scope.center)}-${slugifyScopePart(scope.class)}.xlsx`;
}
