import Link from 'next/link';
import { House, LogOut, Receipt, ShieldCheck, UsersRound, Wallet } from 'lucide-react';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { logout } from './actions';

export const memberNavItems = [
  { href: '/dashboard', label: '대시보드', icon: House },
  { href: '/children', label: '자녀 관리', icon: UsersRound },
  { href: '/account', label: '계좌 관리', icon: Wallet },
  { href: '/consent', label: '동의 관리', icon: ShieldCheck },
  { href: '/payments', label: '결제 내역', icon: Receipt },
] as const;

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('cms_members')
    .select('name, member_no')
    .eq('id', user.id)
    .single();

  return (
    <div className="page-shell pb-10">
      <header className="shell-frame shell-stack">
        <div className="shell-panel overflow-hidden">
          <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="space-y-4">
              <span className="section-eyebrow">학부모 서비스</span>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-[color:var(--brand-ink)] sm:text-4xl">
                    네스트 레저
                  </h1>
                  <span className="status-chip border border-primary/15 bg-primary/8 text-primary">
                    이용 중인 멤버
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  자녀 등록, 자동이체 동의, 결제 이력을 한곳에서 차분하게 관리할 수
                  있는 학부모용 화면입니다.
                </p>
              </div>
              {member ? (
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="rounded-full border border-border/70 bg-[color:var(--surface-strong)] px-4 py-2">
                    {member.name}
                  </div>
                  <div className="rounded-full border border-border/70 bg-[color:var(--surface-strong)] px-4 py-2">
                    {member.member_no}
                  </div>
                </div>
              ) : null}
            </div>

            <form action={logout} className="self-start">
              <button
                type="submit"
                className="nav-pill border border-border/70 bg-[color:var(--surface-strong)]"
              >
                <LogOut className="size-4" />
                로그아웃
              </button>
            </form>
          </div>

          <nav className="border-t border-border/70 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {memberNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-pill border border-transparent"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
