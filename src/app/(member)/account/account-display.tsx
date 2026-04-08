'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarClock, Landmark, Trash2, UserRound } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BANK_CODES } from '@/lib/constants';
import { maskAccount } from '@/lib/crypto';
import { getErrorMessage } from '@/lib/utils';

import { deleteAccount } from './actions';

interface AccountDisplayProps {
  account: {
    id: string;
    bank_code: string;
    account_number_enc: string;
    account_holder: string;
    consent_status: 'pending' | 'consented' | 'revoked';
    consented_at: string | null;
    created_at: string;
  };
  decryptedAccountNumber: string;
}

function getConsentBadge(status: AccountDisplayProps['account']['consent_status']) {
  switch (status) {
    case 'consented':
      return <Badge className="border-transparent bg-secondary text-secondary-foreground">동의 완료</Badge>;
    case 'pending':
      return <Badge className="border-transparent bg-accent text-accent-foreground">동의 대기</Badge>;
    case 'revoked':
      return <Badge variant="outline">동의 철회</Badge>;
    default:
      return <Badge variant="outline">상태 없음</Badge>;
  }
}

function getConsentCopy(status: AccountDisplayProps['account']['consent_status']) {
  switch (status) {
    case 'consented':
      return '자동이체 배치에 포함될 수 있는 상태입니다.';
    case 'pending':
      return '출금 동의를 마치면 자동이체 배치에 포함됩니다.';
    case 'revoked':
      return '동의를 다시 진행해야 자동이체를 재개할 수 있습니다.';
    default:
      return '계좌 상태를 다시 확인해 주세요.';
  }
}

export default function AccountDisplay({
  account,
  decryptedAccountNumber,
}: AccountDisplayProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bankName =
    BANK_CODES.find((bank) => bank.code === account.bank_code)?.name ??
    account.bank_code;
  const maskedAccount = maskAccount(decryptedAccountNumber);

  const handleDelete = async () => {
    const confirmed = confirm(
      '정말로 등록된 계좌를 삭제하시겠습니까? 출금 동의도 함께 철회됩니다.'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAccount(account.id);

      if (result.success) {
        alert('등록된 계좌를 삭제했습니다.');
        router.push('/account');
        router.refresh();
        return;
      }

      setError(result.error || '계좌를 삭제하는 중 문제가 발생했습니다.');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, '계좌를 삭제하는 중 문제가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-4">
        <span className="section-eyebrow">등록된 계좌</span>
        <CardTitle className="text-[1.9rem]">현재 연결된 출금 계좌입니다</CardTitle>
        <CardDescription className="leading-7">
          실제 계좌번호는 일부만 보이도록 마스킹해 표시합니다. 계좌를 바꾸고 싶다면
          삭제 후 다시 등록해 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="ledger-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Landmark className="size-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">은행</p>
                <p className="mt-1 font-medium text-[color:var(--brand-ink)]">{bankName}</p>
              </div>
            </div>
          </div>

          <div className="ledger-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <UserRound className="size-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">예금주</p>
                <p className="mt-1 font-medium text-[color:var(--brand-ink)]">
                  {account.account_holder}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ledger-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">계좌번호</p>
              <p className="mt-2 font-mono text-xl font-semibold text-[color:var(--brand-ink)]">
                {maskedAccount}
              </p>
            </div>
            {getConsentBadge(account.consent_status)}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {getConsentCopy(account.consent_status)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">등록일</p>
                <p className="mt-1 text-sm font-medium text-[color:var(--brand-ink)]">
                  {new Date(account.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">동의 일시</p>
                <p className="mt-1 text-sm font-medium text-[color:var(--brand-ink)]">
                  {account.consented_at
                    ? new Date(account.consented_at).toLocaleDateString('ko-KR')
                    : '아직 동의하지 않았습니다'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="size-4" />
          {loading ? '삭제하는 중입니다...' : '계좌 삭제'}
        </Button>
      </CardContent>
    </Card>
  );
}
