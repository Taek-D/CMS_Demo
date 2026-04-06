import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
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

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;
  const statusFilter = params.status;

  let query = supabase
    .from('cms_billing_results')
    .select(`
      *,
      cms_billing_batches (
        batch_month
      )
    `)
    .eq('member_id', user.id)
    .order('created_at', { ascending: false });

  if (statusFilter && ['success', 'failed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data: payments } = await query;

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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">결제 내역 조회</h1>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        <a
          href="/payments"
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            !statusFilter
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체
        </a>
        <a
          href="/payments?status=success"
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            statusFilter === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          성공
        </a>
        <a
          href="/payments?status=failed"
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            statusFilter === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          실패
        </a>
      </div>

      {/* 결제 내역 테이블 */}
      {payments && payments.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>배치 월</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>실패 사유</TableHead>
                  <TableHead>처리일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.cms_billing_batches?.batch_month || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {payment.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-red-600">
                      {payment.fail_reason || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.processed_at
                        ? new Date(payment.processed_at).toLocaleString('ko-KR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            조회된 결제 내역이 없습니다
          </CardContent>
        </Card>
      )}
    </div>
  );
}
