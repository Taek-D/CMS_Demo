import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { logout } from './actions';

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 확인 - 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  const user = await requireAuth();
  const supabase = await createClient();

  // 회원 정보 조회
  const { data: member } = await supabase
    .from('cms_members')
    .select('name, member_no')
    .eq('id', user.id)
    .single();

  const navItems = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/account', label: '계좌 관리' },
    { href: '/consent', label: '출금 동의' },
    { href: '/payments', label: '결제 내역' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-blue-600">CMS Auto-Debit</h1>
              {member && (
                <p className="text-sm text-gray-600">
                  {member.name} ({member.member_no})
                </p>
              )}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-blue-600 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 콘텐츠 */}
      <main>{children}</main>
    </div>
  );
}
