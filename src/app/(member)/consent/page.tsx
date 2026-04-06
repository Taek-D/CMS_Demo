import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import ConsentCard from './consent-card';

export default async function ConsentPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('cms_bank_accounts')
    .select('*')
    .eq('member_id', user.id)
    .single();

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <ConsentCard account={account} />
    </div>
  );
}
