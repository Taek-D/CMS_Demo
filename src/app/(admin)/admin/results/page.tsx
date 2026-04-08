import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { decryptAccount, maskAccount } from '@/lib/crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { BankAccount, BillingBatch, BillingResult, Member } from '@/types/database';
import Link from 'next/link';

type ResultRow = BillingResult & {
  cms_members: Pick<Member, 'member_no' | 'name' | 'email'>;
  cms_bank_accounts: Pick<BankAccount, 'account_number_enc' | 'bank_code'> & {
    account_number?: string;
    masked_account?: string;
  };
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch_id?: string; filter?: string }>;
}) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const params = await searchParams;
  const batchId = params.batch_id;
  const filter = params.filter;

  const { data: batches } = await supabase
    .from('cms_billing_batches')
    .select('*')
    .order('created_at', { ascending: false });

  let results: ResultRow[] = [];
  let selectedBatch: BillingBatch | null = null;

  if (batchId) {
    const { data: batch } = await supabase
      .from('cms_billing_batches')
      .select('*')
      .eq('id', batchId)
      .single();
    selectedBatch = (batch as BillingBatch | null) ?? null;

    let query = supabase
      .from('cms_billing_results')
      .select(`
        *,
        cms_members!inner (
          member_no,
          name,
          email
        ),
        cms_bank_accounts!inner (
          account_number_enc,
          bank_code
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (filter === 'failed') {
      query = query.eq('status', 'failed');
    }

    const { data } = await query;
    results = (data as ResultRow[] | null) || [];

    for (const result of results) {
      try {
        result.cms_bank_accounts.account_number = decryptAccount(
          result.cms_bank_accounts.account_number_enc
        );
        result.cms_bank_accounts.masked_account = maskAccount(
          result.cms_bank_accounts.account_number
        );
      } catch {
        result.cms_bank_accounts.masked_account = '***';
      }
    }
  }

  const overdueQuery = new URLSearchParams({ status: 'failed' });

  if (selectedBatch?.batch_month) {
    overdueQuery.set('month', selectedBatch.batch_month);
  }

  const overdueHref = `/admin/overdue?${overdueQuery.toString()}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">성공</Badge>;
      case 'failed':
        return <Badge variant="destructive">실패</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500">처리중</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">출금 결과 조회</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>배치 회차 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {batches?.map((batch) => (
              <a
                key={batch.id}
                href={`/admin/results?batch_id=${batch.id}`}
                className={`rounded-lg border px-4 py-2 transition ${
                  batchId === batch.id
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{batch.batch_month}</p>
                <p className="text-xs opacity-80">
                  {batch.status} | 총 {batch.total_count}건
                </p>
              </a>
            ))}
            {(!batches || batches.length === 0) && (
              <p className="py-4 text-gray-500">아직 실행된 배치가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedBatch && (
        <div className="mb-6 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">총 대상</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{selectedBatch.total_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">성공</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{selectedBatch.success_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">실패</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{selectedBatch.fail_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">성공률</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">
                {selectedBatch.total_count > 0
                  ? ((selectedBatch.success_count / selectedBatch.total_count) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-6 border-indigo-200 bg-indigo-50/60">
        <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-900">Overdue follow-up</p>
            <p className="text-sm text-indigo-800">
              {selectedBatch
                ? `Open overdue management for ${selectedBatch.batch_month} failed results.`
                : 'Open overdue management and start from failed results.'}
            </p>
          </div>
          <Link
            href={overdueHref}
            data-testid="results-overdue-link"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Open overdue management
          </Link>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="mb-4 flex gap-2">
          <a
            href={`/admin/results?batch_id=${batchId}`}
            className={`rounded-md px-3 py-1 text-sm ${
              !filter ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            전체 ({results.length})
          </a>
          <a
            href={`/admin/results?batch_id=${batchId}&filter=failed`}
            className={`rounded-md px-3 py-1 text-sm ${
              filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            실패 ({results.filter((result) => result.status === 'failed').length})
          </a>
        </div>
      )}

      {results.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회원번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>계좌번호</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>실패 사유</TableHead>
                  <TableHead>처리일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-mono">{result.cms_members.member_no}</TableCell>
                    <TableCell>{result.cms_members.name}</TableCell>
                    <TableCell className="font-mono">
                      {result.cms_bank_accounts.masked_account}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-red-600">{result.fail_reason || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {result.processed_at
                        ? new Date(result.processed_at).toLocaleString('ko-KR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        batchId && (
            <Card>
            <CardContent className="py-12 text-center text-gray-500">
              조회된 출금 결과가 없습니다
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
