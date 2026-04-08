import Link from 'next/link';
import { CalendarRange, CircleAlert, CircleCheckBig, Filter, ReceiptText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge className="border-transparent bg-secondary text-secondary-foreground">성공</Badge>;
    case 'failed':
      return <Badge variant="destructive">실패</Badge>;
    case 'pending':
      return <Badge className="border-transparent bg-primary/10 text-primary">처리 중</Badge>;
    default:
      return <Badge variant="outline">상태 없음</Badge>;
  }
}

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
    .select(
      `
        *,
        cms_billing_batches (
          batch_month
        )
      `
    )
    .eq('member_id', user.id)
    .order('created_at', { ascending: false });

  if (statusFilter && ['success', 'failed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data: payments } = await query;
  const paymentRows = payments ?? [];
  const successCount = paymentRows.filter((payment) => payment.status === 'success').length;
  const failedCount = paymentRows.filter((payment) => payment.status === 'failed').length;

  const filters = [
    { href: '/payments', label: '전체', active: !statusFilter },
    { href: '/payments?status=success', label: '성공', active: statusFilter === 'success' },
    { href: '/payments?status=failed', label: '실패', active: statusFilter === 'failed' },
  ];

  return (
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <div className="shell-stack">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
          <Card className="border-border/70">
            <CardHeader className="space-y-4">
              <span className="section-eyebrow">결제 내역</span>
              <CardTitle className="text-[2rem]">자동이체 결과를 한눈에 확인하세요</CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                배치 월, 처리 금액, 성공 여부, 실패 사유를 한 화면에서 정리했습니다.
                결과가 누적될수록 보호자 관점에서 이해하기 쉬운 형태로 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="metric-tile">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">전체 건수</p>
                  <ReceiptText className="size-4 text-primary" />
                </div>
                <p className="data-value mt-6 text-[2.3rem]">{paymentRows.length}</p>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">성공 건수</p>
                  <CircleCheckBig className="size-4 text-primary" />
                </div>
                <p className="data-value mt-6 text-[2.3rem]">{successCount}</p>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">실패 건수</p>
                  <CircleAlert className="size-4 text-primary" />
                </div>
                <p className="data-value mt-6 text-[2.3rem]">{failedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>필터</CardTitle>
              <CardDescription>
                성공 또는 실패 상태만 골라서 결과를 빠르게 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="size-4" />
                상태 기준 보기
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filterItem) => (
                  <Link
                    key={filterItem.href}
                    href={filterItem.href}
                    className={`nav-pill border ${
                      filterItem.active
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border/70 bg-[color:var(--surface-strong)]'
                    }`}
                  >
                    {filterItem.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {paymentRows.length > 0 ? (
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>결제 기록 목록</CardTitle>
              <CardDescription>
                최근 순서대로 자동이체 결과를 정리했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentRows.map((payment) => (
                <div
                  key={payment.id}
                  className="grid gap-4 rounded-[1.35rem] border border-border/70 bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1.1fr_0.8fr_0.7fr_1fr]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarRange className="size-4" />
                      배치 월
                    </div>
                    <p className="font-medium text-[color:var(--brand-ink)]">
                      {payment.cms_billing_batches?.batch_month || '-'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">금액</p>
                    <p className="font-medium text-[color:var(--brand-ink)]">
                      {payment.amount.toLocaleString()}원
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">상태</p>
                    <div>{getStatusBadge(payment.status)}</div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">처리 메모</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {payment.fail_reason || '정상 처리되었습니다.'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.processed_at
                        ? new Date(payment.processed_at).toLocaleString('ko-KR')
                        : '처리 일시 없음'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70">
            <CardContent className="py-14 text-center">
              <p className="text-base font-medium text-[color:var(--brand-ink)]">
                아직 결제 내역이 없습니다
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                첫 자동이체 결과가 쌓이면 이 화면에서 성공, 실패, 처리 시각까지 함께 볼 수
                있습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
