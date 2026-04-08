import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Member } from '@/types/database';

type AdminAccess =
  | { kind: 'ok'; member: Member }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' };

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { kind: 'unauthenticated' };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return { kind: 'forbidden' };
  }

  const { data: member } = await supabase
    .from('cms_members')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!member) {
    return { kind: 'forbidden' };
  }

  return { kind: 'ok', member: member as Member };
}

export async function requireAdmin() {
  const access = await getAdminAccess();

  if (access.kind === 'unauthenticated') {
    redirect('/login');
  }

  if (access.kind === 'forbidden') {
    redirect('/dashboard');
  }

  return access.member;
}
