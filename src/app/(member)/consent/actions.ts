'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function giveConsent() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('cms_bank_accounts')
    .update({
      consent_status: 'consented',
      consented_at: now,
    })
    .eq('member_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/consent');
  revalidatePath('/account');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function revokeConsent() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('cms_bank_accounts')
    .update({
      consent_status: 'revoked',
      consented_at: null,
    })
    .eq('member_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/consent');
  revalidatePath('/account');
  revalidatePath('/dashboard');
  
  return { success: true };
}
