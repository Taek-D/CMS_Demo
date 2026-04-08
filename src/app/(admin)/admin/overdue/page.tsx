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
  const entries = Object.entries(params).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      const firstValue = value[0]?.trim();
      return firstValue ? [[key, firstValue] as const] : [];
    }

    return value?.trim() ? [[key, value.trim()] as const] : [];
  });

  return new URLSearchParams(entries).toString();
}

function getStatusBadge(row: OverdueRow) {
  switch (row.status) {
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'success':
      return <Badge className="bg-green-600">Success</Badge>;
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-black">
          Pending
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
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Overdue Management</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-5">
            <input
              type="month"
              name="month"
              aria-label="Batch month"
              data-testid="admin-overdue-month-filter"
              defaultValue={filters.month}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="center"
              aria-label="Childcare center"
              data-testid="admin-overdue-center-filter"
              placeholder="Childcare center"
              defaultValue={filters.center}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              name="class"
              aria-label="Class"
              data-testid="admin-overdue-class-filter"
              placeholder="Class name"
              defaultValue={filters.class}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              name="status"
              aria-label="Billing status"
              data-testid="admin-overdue-status-filter"
              defaultValue={filters.status}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="all">All statuses</option>
            </select>
            <div className="flex gap-2 md:col-span-1">
              <input
                type="text"
                name="search"
                aria-label="Parent or child search"
                data-testid="admin-overdue-search-filter"
                placeholder="Parent or child"
                defaultValue={filters.search}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                data-testid="admin-overdue-submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Search
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
                Export statement
              </a>
            ) : (
              <p
                data-testid="admin-overdue-export-hint"
                className="text-sm text-gray-500"
              >
                Select month, childcare center, and class to enable statement export.
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
                <TableHead>Member No.</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Children</TableHead>
                <TableHead>Childcare Center</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Batch Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Billing Status</TableHead>
                <TableHead>Fail Reason</TableHead>
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
              No overdue rows match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
