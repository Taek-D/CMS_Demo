import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdmin } from '@/lib/admin-auth';

import {
  fetchOverdueRows,
  normalizeOverdueFilters,
  type OverdueRow,
  type OverdueSearchParams,
} from './data';

function canExportStatement(params: OverdueSearchParams) {
  return Boolean(params.month && params.center && params.class);
}

function toQueryString(params: OverdueSearchParams) {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      const firstValue = value[0]?.trim();
      if (firstValue) {
        entries.push([key, firstValue]);
      }

      continue;
    }

    const trimmedValue = value?.trim();

    if (trimmedValue) {
      entries.push([key, trimmedValue]);
    }
  }

  return new URLSearchParams(entries).toString();
}

function getStatusBadge(row: OverdueRow) {
  switch (row.status) {
    case 'failed':
      return <Badge variant="destructive">실패</Badge>;
    case 'success':
      return <Badge className="bg-green-600">성공</Badge>;
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-black">
          대기 중
        </Badge>
      );
    default:
      return <Badge variant="outline">{row.status}</Badge>;
  }
}

export default async function OverduePage({
  searchParams,
}: {
  searchParams: Promise<OverdueSearchParams>;
}) {
  await requireAdmin();

  const rawSearchParams = await searchParams;
  const filters = normalizeOverdueFilters(rawSearchParams);
  const rows = await fetchOverdueRows(rawSearchParams);
  const exportEnabled = canExportStatement(rawSearchParams);
  const exportHref = exportEnabled
    ? `/admin/overdue/export?${toQueryString(rawSearchParams)}`
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">미납 관리</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-5">
            <input
              type="month"
              name="month"
              aria-label="배치 월"
              data-testid="admin-overdue-month-filter"
              defaultValue={filters.month}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="center"
              aria-label="어린이집"
              data-testid="admin-overdue-center-filter"
              placeholder="어린이집 이름"
              defaultValue={filters.center}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="class"
              aria-label="반"
              data-testid="admin-overdue-class-filter"
              placeholder="반 이름"
              defaultValue={filters.class}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              name="status"
              aria-label="결제 상태"
              data-testid="admin-overdue-status-filter"
              defaultValue={filters.status}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="failed">실패</option>
              <option value="pending">대기 중</option>
              <option value="success">성공</option>
              <option value="all">전체 상태</option>
            </select>
            <div className="flex gap-2 md:col-span-1">
              <input
                type="text"
                name="search"
                aria-label="학부모 또는 자녀 검색"
                data-testid="admin-overdue-search-filter"
                placeholder="학부모 또는 자녀"
                defaultValue={filters.search}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                data-testid="admin-overdue-submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                조회
              </button>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-end">
            {exportHref ? (
              <a
                href={exportHref}
                data-testid="admin-overdue-export-link"
                className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                거래명세표 다운로드
              </a>
            ) : (
              <p
                data-testid="admin-overdue-export-hint"
                className="text-sm text-gray-500"
              >
                월, 어린이집, 반을 모두 선택하면 거래명세표를 내려받을 수 있습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table data-testid="admin-overdue-table">
            <TableHeader>
              <TableRow>
                <TableHead>회원번호</TableHead>
                <TableHead>학부모</TableHead>
                <TableHead>자녀</TableHead>
                <TableHead>어린이집</TableHead>
                <TableHead>반</TableHead>
                <TableHead>배치 월</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>결제 상태</TableHead>
                <TableHead>실패 사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">{row.memberNo}</TableCell>
                  <TableCell>{row.parentName}</TableCell>
                  <TableCell>{row.childNames}</TableCell>
                  <TableCell>{row.centerNames}</TableCell>
                  <TableCell>{row.classNames}</TableCell>
                  <TableCell>{row.batchMonth}</TableCell>
                  <TableCell>{row.amount.toLocaleString('ko-KR')}</TableCell>
                  <TableCell>{getStatusBadge(row)}</TableCell>
                  <TableCell>{row.failReason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rows.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              현재 필터에 맞는 미납 내역이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
