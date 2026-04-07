import Link from 'next/link';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { logout } from './actions';

export const memberNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/children', label: 'Children' },
  { href: '/account', label: 'Account' },
  { href: '/consent', label: 'Consent' },
  { href: '/payments', label: 'Payments' },
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-blue-600">CMS Auto-Debit</h1>
            {member ? (
              <p className="text-sm text-gray-600">
                {member.name} ({member.member_no})
              </p>
            ) : null}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 py-3">
            {memberNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
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
