import { FileCheck2, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

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
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
        <section className="shell-stack">
          <div className="space-y-3">
            <span className="section-eyebrow">출금 동의</span>
            <h2 className="section-title">자동이체 진행에 필요한 동의 상태를 관리하세요</h2>
            <p className="section-copy max-w-2xl">
              계좌 등록이 끝났다면 이제 자동이체 동의를 마무리할 차례입니다. 동의 완료,
              대기, 철회 상태를 한눈에 확인하고 필요 시 바로 변경할 수 있게 구성했습니다.
            </p>
          </div>

          <ConsentCard account={account} />
        </section>

        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">안내</span>
            <CardTitle className="text-[1.7rem]">동의 상태에 따라 처리 흐름이 달라집니다</CardTitle>
            <CardDescription className="leading-7">
              자동이체는 동의 완료 상태의 계좌만 배치 대상에 포함됩니다. 동의를 철회하면
              이후 배치에서 제외되며, 다시 시작하려면 재동의가 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ledger-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--brand-ink)]">동의 완료</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    배치 출금 요청 시 자동이체 대상에 포함될 수 있는 상태입니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="ledger-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-secondary/15 p-2 text-secondary-foreground">
                  <FileCheck2 className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--brand-ink)]">동의 철회</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    출금 중단이 필요한 상황이라면 철회 후 다시 동의하는 방식으로 관리할 수
                    있습니다.
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
