import { ShieldCheck, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth';
import { decryptAccount } from '@/lib/crypto';
import { createClient } from '@/lib/supabase/server';

import AccountDisplay from './account-display';
import AccountForm from './account-form';

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
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
        <section className="shell-stack">
          <div className="space-y-3">
            <span className="section-eyebrow">계좌 관리</span>
            <h2 className="section-title">자동이체에 사용할 계좌를 안전하게 관리하세요</h2>
            <p className="section-copy max-w-2xl">
              출금 계좌 등록, 예금주 정보 확인, 계좌 삭제까지 한 화면에서 정리했습니다.
              계좌번호는 암호화해서 저장되며, 동의 상태는 다음 단계인 출금 동의 관리와
              자연스럽게 이어집니다.
            </p>
          </div>

          {account ? (
            <AccountDisplay
              account={account}
              decryptedAccountNumber={decryptedAccountNumber}
            />
          ) : (
            <AccountForm />
          )}
        </section>

        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">안내</span>
            <CardTitle className="text-[1.7rem]">계좌 등록 전 확인해 주세요</CardTitle>
            <CardDescription className="leading-7">
              실제 출금 요청 전에 보호자가 입력한 계좌 정보와 예금주명이 일치해야 하며,
              출금 동의까지 완료되어야 자동이체 배치에 포함됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ledger-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--brand-ink)]">입력 정보 확인</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    은행, 계좌번호, 예금주명이 정확해야 출금 실패를 줄일 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="ledger-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary/15 p-2 text-secondary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--brand-ink)]">암호화 저장</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    민감한 계좌 정보는 서버에서 암호화되어 저장되고, 화면에는 마스킹된
                    형태로만 표시됩니다.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
