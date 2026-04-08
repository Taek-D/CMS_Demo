import { NextResponse } from 'next/server';

import { getAdminAccess } from '@/lib/admin-auth';

import type { OverdueSearchParams } from '../data';
import { fetchOverdueRows, normalizeOverdueFilters } from '../data';

import { buildOverdueFilename, buildOverdueWorkbook } from './workbook';

const REQUIRED_SCOPE_ERROR = 'month, center, and class are required for export.';

function toOverdueSearchParams(searchParams: URLSearchParams): OverdueSearchParams {
  const params = new Map<string, string[]>();

  for (const [key, value] of searchParams.entries()) {
    const values = params.get(key) ?? [];
    values.push(value);
    params.set(key, values);
  }

  return {
    month: params.get('month'),
    center: params.get('center'),
    class: params.get('class'),
    status: params.get('status'),
    search: params.get('search'),
  };
}

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const adminAccess = await getAdminAccess();

  if (adminAccess.kind !== 'ok') {
    return NextResponse.json(
      { error: 'Admin access is required.' },
      { status: adminAccess.kind === 'unauthenticated' ? 401 : 403 }
    );
  }

  const rawParams = toOverdueSearchParams(new URL(request.url).searchParams);
  const filters = normalizeOverdueFilters(rawParams);

  if (!filters.month || !filters.center || !filters.class) {
    return NextResponse.json(
      { error: REQUIRED_SCOPE_ERROR },
      { status: 400 }
    );
  }

  const rows = await fetchOverdueRows(rawParams);
  const workbook = await buildOverdueWorkbook(rows);
  const fileName = buildOverdueFilename({
    month: filters.month,
    center: filters.center,
    class: filters.class,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const encodedFileName = encodeURIComponent(fileName);
  const asciiFallbackName = `overdue-statement-${filters.month}.xlsx`;

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${asciiFallbackName}"; filename*=UTF-8''${encodedFileName}`,
    },
  });
}
