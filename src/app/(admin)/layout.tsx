import Link from 'next/link';
import {
  ArrowRightLeft,
  CreditCard,
  LayoutDashboard,
  TriangleAlert,
  Users,
} from 'lucide-react';

import { requireAdmin } from '@/lib/admin-auth';

const navItems = [
  { href: '/admin', label: '개요', icon: LayoutDashboard },
  { href: '/admin/members', label: '회원 관리', icon: Users },
  { href: '/admin/billing', label: '배치 출금', icon: CreditCard },
  { href: '/admin/results', label: '출금 결과', icon: ArrowRightLeft },
  { href: '/admin/overdue', label: '미납 관리', icon: TriangleAlert },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="page-shell pb-10">
      <header className="shell-frame shell-stack">
        <div className="shell-panel overflow-hidden">
          <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="space-y-4">
              <span className="section-eyebrow">관리자 운영 화면</span>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-[color:var(--brand-ink)] sm:text-4xl">
                    어린이집 수납 CRM
                  </h1>
                  <span className="status-chip border border-secondary-foreground/10 bg-secondary/65 text-secondary-foreground">
                    검증 완료 흐름
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  회원 조회, 배치 실행, 미납 관리, 거래명세표 다운로드를 한 흐름으로
                  이어주는 관리자용 운영 화면입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="rounded-full border border-border/70 bg-[color:var(--surface-strong)] px-4 py-2">
                  {admin.name}
                </div>
                <div className="rounded-full border border-border/70 bg-[color:var(--surface-strong)] px-4 py-2">
                  {admin.member_no}
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="nav-pill self-start border border-border/70 bg-[color:var(--surface-strong)]"
            >
              멤버 화면 열기
            </Link>
          </div>

          <nav className="border-t border-border/70 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
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
