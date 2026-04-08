import Link from 'next/link';
import {
  ArrowUpRight,
  CreditCard,
  FileSpreadsheet,
  TriangleAlert,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { count: totalMembers } = await supabase
    .from('cms_members')
    .select('*', { count: 'exact', head: true });

  const { count: totalAccounts } = await supabase
    .from('cms_bank_accounts')
    .select('*', { count: 'exact', head: true });

  const { count: consentedAccounts } = await supabase
    .from('cms_bank_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('consent_status', 'consented');

  const { data: latestBatch } = await supabase
    .from('cms_billing_batches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const stats = [
    { label: '총 회원 수', value: totalMembers || 0, icon: Users },
    { label: '등록 계좌 수', value: totalAccounts || 0, icon: CreditCard },
    { label: '동의 완료 계좌', value: consentedAccounts || 0, icon: TriangleAlert },
    {
      label: '최근 배치 월',
      value: latestBatch?.batch_month || '-',
      icon: FileSpreadsheet,
    },
  ];

  const actions = [
    {
      href: '/admin/members',
      title: '회원 CRM',
      copy: '학부모, 자녀, 어린이집, 반 관계를 한곳에서 조회합니다.',
    },
    {
      href: '/admin/billing',
      title: '배치 출금 실행',
      copy: '월별 자동이체를 실행하고 운영 기록이 남도록 관리합니다.',
    },
    {
      href: '/admin/results',
      title: '출금 결과 확인',
      copy: '처리 결과를 검토하고 미납 관리 흐름으로 바로 이동합니다.',
    },
    {
      href: '/admin/overdue',
      title: '미납 회원 관리',
      copy: '실패 건을 필터링하고 어린이집/반 기준 거래명세표를 다운로드합니다.',
    },
  ];

  return (
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_24rem]">
        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">운영 개요</span>
            <div className="space-y-3">
              <CardTitle className="text-[2rem] sm:text-[2.5rem]">
                회원 관리와 수납 운영을 한 화면에서.
              </CardTitle>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                숫자만 나열된 관리자 화면이 아니라, 실제 운영 흐름이 자연스럽게
                이어지도록 구성한 관리자용 첫 화면입니다.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="metric-tile">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="data-value mt-6 text-[2.2rem] sm:text-[2.6rem]">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>최근 배치 신호</CardTitle>
          </CardHeader>
          <CardContent>
            {latestBatch ? (
              <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-[color:var(--surface-strong)] p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    배치 월
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
                    {latestBatch.batch_month}
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <p>상태: {latestBatch.status}</p>
                  <p>전체 건수: {latestBatch.total_count}</p>
                  <p>성공: {latestBatch.success_count}</p>
                  <p>실패: {latestBatch.fail_count}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-6 text-center text-sm leading-7 text-muted-foreground">
                아직 실행된 배치가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>빠른 이동</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-[1.5rem] border border-border/70 bg-[color:var(--surface-strong)] px-5 py-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-base font-medium text-[color:var(--brand-ink)]">
                      {action.title}
                    </p>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      {action.copy}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 size-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
