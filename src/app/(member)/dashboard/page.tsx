import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  HeartHandshake,
  UsersRound,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export function buildDashboardChildrenSummary(count: number) {
  return {
    title: '자녀 관리',
    description: '멤버 계정에 연결된 자녀 정보를 관리합니다.',
    href: '/children',
    count,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'consented':
      return <Badge className="border-transparent bg-secondary text-secondary-foreground">동의 완료</Badge>;
    case 'pending':
      return <Badge className="border-transparent bg-accent text-accent-foreground">미동의</Badge>;
    case 'revoked':
      return <Badge variant="outline">철회됨</Badge>;
    default:
      return <Badge variant="outline">상태 없음</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge className="border-transparent bg-secondary text-secondary-foreground">성공</Badge>;
    case 'failed':
      return <Badge variant="destructive">실패</Badge>;
    case 'pending':
      return <Badge className="border-transparent bg-primary/10 text-primary">대기</Badge>;
    default:
      return <Badge variant="outline">알 수 없음</Badge>;
  }
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [memberResult, accountsResult, recentPaymentsResult, childrenResult] =
    await Promise.all([
      supabase.from('cms_members').select('*').eq('id', user.id).single(),
      supabase.from('cms_bank_accounts').select('*').eq('member_id', user.id),
      supabase
        .from('cms_billing_results')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('cms_children').select('id').eq('parent_member_id', user.id),
    ]);

  const member = memberResult.data;
  const accounts = accountsResult.data ?? [];
  const recentPayments = recentPaymentsResult.data ?? [];
  const childrenSummary = buildDashboardChildrenSummary(
    childrenResult.data?.length ?? 0
  );
  const account = accounts[0];

  const summaryTiles = [
    {
      label: '등록된 자녀 수',
      value: String(childrenSummary.count),
      icon: UsersRound,
    },
    {
      label: '자동이체 동의 상태',
      value: account?.consent_status
        ? account.consent_status === 'consented'
          ? '동의 완료'
          : account.consent_status === 'pending'
            ? '미동의'
            : '철회됨'
        : '미등록',
      icon: HeartHandshake,
    },
    {
      label: '최근 결제 기준일',
      value: recentPayments[0]?.created_at
        ? new Date(recentPayments[0].created_at).toLocaleDateString('ko-KR')
        : '내역 없음',
      icon: CalendarClock,
    },
  ];

  const quickActions = [
    {
      href: '/children',
      title: '자녀 정보 관리',
      copy: '자녀를 등록하거나 반 배정을 바꾸고, 기존 프로필을 수정할 수 있습니다.',
    },
    {
      href: '/account',
      title: '출금 계좌 확인',
      copy: '예금주 정보와 현재 등록된 결제 계좌 상태를 확인합니다.',
    },
    {
      href: '/payments',
      title: '결제 이력 열기',
      copy: '최근 결제 결과를 따로 헤매지 않고 바로 확인할 수 있습니다.',
    },
  ];

  return (
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_22rem]">
        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">멤버 요약</span>
            <div className="space-y-3">
              <CardTitle className="text-[2rem] sm:text-[2.4rem]">
                {member?.name ?? '멤버'}님 가족 대시보드
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-7 sm:text-base">
                자녀 등록, 자동이체 동의, 결제 기록을 한 화면에서 자연스럽게
                확인할 수 있도록 정리한 학부모 중심 요약 화면입니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {summaryTiles.map((tile) => {
              const Icon = tile.icon;

              return (
                <div key={tile.label} className="metric-tile">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{tile.label}</p>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="data-value mt-6 text-[2.2rem] sm:text-[2.5rem]">
                    {tile.value}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>계좌 상태 요약</CardTitle>
            <CardDescription>
              현재 연결된 출금 계좌의 핵심 정보만 빠르게 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {account ? (
              <>
                <div className="rounded-[1.35rem] border border-border/70 bg-[color:var(--surface-strong)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    예금주
                  </p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--brand-ink)]">
                    {account.account_holder}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">동의 상태</span>
                  {getStatusBadge(account.consent_status)}
                </div>
                <Link href="/account">
                  <Button variant="outline" size="lg" className="w-full">
                    <Wallet className="size-4" />
                    계좌 관리 열기
                  </Button>
                </Link>
              </>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-6 text-center">
                <p className="text-sm leading-7 text-muted-foreground">
                  아직 결제 계좌가 등록되지 않았습니다.
                </p>
                <Link href="/account" className="mt-4 inline-flex w-full">
                  <Button size="lg" className="w-full">
                    계좌 등록하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>다음으로 많이 하는 작업</CardTitle>
            <CardDescription>
              멤버가 자주 찾는 화면을 자연스럽게 이어주는 빠른 이동 영역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
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

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>최근 결제 이력</CardTitle>
            <CardDescription>
              멤버 번호에 연결된 최근 다섯 건의 결제 결과를 보여줍니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length > 0 ? (
              <>
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-[1.35rem] border border-border/70 bg-[color:var(--surface-strong)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium text-[color:var(--brand-ink)]">
                          {new Date(payment.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.amount.toLocaleString()}원
                        </p>
                      </div>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
                <Link href="/payments">
                  <Button variant="outline" size="lg" className="w-full">
                    <BadgeCheck className="size-4" />
                    전체 결제 내역 보기
                  </Button>
                </Link>
              </>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-6 text-center text-sm leading-7 text-muted-foreground">
                아직 기록된 결제 내역이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
