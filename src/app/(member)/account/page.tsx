import { createClient } from '@/lib/supabase/server';
import { decryptAccount } from '@/lib/crypto';
import { requireAuth } from '@/lib/auth';
import AccountForm from './account-form';
import AccountDisplay from './account-display';

export default async function AccountPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('cms_bank_accounts')
    .select('*')
    .eq('member_id', user.id)
    .single();

  let decryptedAccountNumber = '';
  if (account) {
    decryptedAccountNumber = decryptAccount(account.account_number_enc);
  }

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      {account ? (
        <AccountDisplay account={account} decryptedAccountNumber={decryptedAccountNumber} />
      ) : (
        <AccountForm />
      )}
    </div>
  );
}
