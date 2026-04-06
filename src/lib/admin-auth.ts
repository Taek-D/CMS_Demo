import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // 관리자 이메일 확인
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    redirect('/dashboard');
  }

  // 관리자 회원 정보 조회
  const { data: member } = await supabase
    .from('cms_members')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!member) {
    redirect('/dashboard');
  }

  return member;
}
