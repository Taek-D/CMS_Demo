'use server';

import { createClient } from '@/lib/supabase/server';
import { encryptAccount } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

export async function registerAccount(formData: FormData) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const bankCode = formData.get('bank_code') as string;
  const accountNumber = formData.get('account_number') as string;
  const accountHolder = formData.get('account_holder') as string;

  if (!bankCode || !accountNumber || !accountHolder) {
    return { success: false, error: '모든 필드를 입력해주세요.' };
  }

  // 이미 계좌가 있는지 확인
  const { data: existing } = await supabase
    .from('cms_bank_accounts')
    .select('id')
    .eq('member_id', user.id)
    .single();

  if (existing) {
    return { success: false, error: '이미 등록된 계좌가 있습니다. 먼저 기존 계좌를 해지해주세요.' };
  }

  // 계좌번호 암호화
  const encryptedAccount = encryptAccount(accountNumber);

  // 계좌 저장
  const { error } = await supabase
    .from('cms_bank_accounts')
    .insert({
      member_id: user.id,
      bank_code: bankCode,
      account_number_enc: encryptedAccount,
      account_holder: accountHolder,
      consent_status: 'pending',
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/account');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function deleteAccount(accountId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('cms_bank_accounts')
    .delete()
    .eq('id', accountId)
    .eq('member_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/account');
  revalidatePath('/dashboard');
  
  return { success: true };
}
