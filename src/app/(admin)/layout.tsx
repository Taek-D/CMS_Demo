import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  const navItems = [
    { href: '/admin', label: '대시보드' },
    { href: '/admin/members', label: '회원 관리' },
    { href: '/admin/billing', label: '배치 출금' },
    { href: '/admin/results', label: '출금 결과' },
    { href: '/admin/overdue', label: 'Overdue' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-indigo-600">CMS 관리자 대시보드</h1>
              <p className="text-sm text-gray-600">
                관리자: {admin.name} ({admin.member_no})
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              회원 화면으로 이동
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
