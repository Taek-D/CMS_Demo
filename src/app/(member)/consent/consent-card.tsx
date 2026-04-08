'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CircleSlash2, Clock3, Landmark } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

import { giveConsent, revokeConsent } from './actions';

type ConsentStatus = 'pending' | 'consented' | 'revoked' | 'none';

interface ConsentProps {
  account: {
    id: string;
    consent_status: 'pending' | 'consented' | 'revoked';
    consented_at: string | null;
    bank_code: string;
    account_holder: string;
  } | null;
}

function getConsentBadge(status: ConsentStatus) {
  switch (status) {
    case 'consented':
      return <Badge className="border-transparent bg-secondary text-secondary-foreground">동의 완료</Badge>;
    case 'pending':
      return <Badge className="border-transparent bg-accent text-accent-foreground">동의 대기</Badge>;
    case 'revoked':
      return <Badge variant="outline">동의 철회</Badge>;
    case 'none':
      return <Badge variant="outline">계좌 미등록</Badge>;
    default:
      return <Badge variant="outline">상태 없음</Badge>;
  }
}

function getConsentMessage(status: ConsentStatus) {
  switch (status) {
    case 'consented':
      return '자동이체 출금 요청을 진행할 수 있는 상태입니다.';
    case 'pending':
      return '출금 동의를 완료하면 다음 배치부터 자동이체 대상에 포함됩니다.';
    case 'revoked':
      return '출금 동의를 다시 진행해야 자동이체를 재개할 수 있습니다.';
    case 'none':
      return '먼저 계좌를 등록해야 출금 동의를 진행할 수 있습니다.';
    default:
      return '';
  }
}

function getStatusMeta(status: ConsentStatus) {
  switch (status) {
    case 'consented':
      return { icon: CheckCircle2, title: '출금 가능 상태' };
    case 'pending':
      return { icon: Clock3, title: '동의 대기 상태' };
    case 'revoked':
      return { icon: CircleSlash2, title: '출금 중단 상태' };
    case 'none':
      return { icon: Landmark, title: '계좌 등록 필요' };
    default:
      return { icon: Clock3, title: '상태 확인 필요' };
  }
}

export default function ConsentCard({ account }: ConsentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConsentStatus>(
    account?.consent_status ?? 'none'
  );

  const statusMeta = getStatusMeta(currentStatus);
  const StatusIcon = statusMeta.icon;

  const handleGiveConsent = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await giveConsent();

      if (result.success) {
        setSuccess(true);
        setCurrentStatus('consented');
        router.refresh();
        return;
      }

      setError(result.error || '출금 동의를 처리하는 중 문제가 발생했습니다.');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, '출금 동의를 처리하는 중 문제가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    const confirmed = confirm('정말로 출금 동의를 철회하시겠습니까?');

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await revokeConsent();

      if (result.success) {
        setSuccess(true);
        setCurrentStatus('revoked');
        router.refresh();
        return;
      }

      setError(result.error || '출금 동의를 철회하는 중 문제가 발생했습니다.');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, '출금 동의를 철회하는 중 문제가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70" data-testid="consent-card">
      <CardHeader className="space-y-4">
        <span className="section-eyebrow">현재 동의 상태</span>
        <CardTitle className="text-[1.9rem]">출금 동의 상태를 확인하고 변경하세요</CardTitle>
        <CardDescription className="leading-7">
          등록된 계좌가 있을 때만 동의를 진행할 수 있습니다. 철회 후에는 다시 동의해야
          자동이체를 재개할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <AlertDescription>동의 상태를 변경했습니다.</AlertDescription>
          </Alert>
        ) : null}

        <div className="ledger-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <StatusIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{statusMeta.title}</p>
                <p className="mt-1 text-base font-medium text-[color:var(--brand-ink)]">
                  {account?.account_holder ?? '계좌를 먼저 등록해 주세요'}
                </p>
              </div>
            </div>
            {getConsentBadge(currentStatus)}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {getConsentMessage(currentStatus)}
          </p>
        </div>

        {account?.consented_at && currentStatus === 'consented' ? (
          <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">
            동의 일시: {new Date(account.consented_at).toLocaleDateString('ko-KR')}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {(currentStatus === 'pending' ||
          currentStatus === 'revoked' ||
          currentStatus === 'none') ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleGiveConsent}
            disabled={loading || currentStatus === 'none'}
          >
            {loading ? '처리 중입니다...' : '출금 동의하기'}
          </Button>
        ) : null}

        {currentStatus === 'consented' ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
            onClick={handleRevokeConsent}
            disabled={loading}
          >
            {loading ? '처리 중입니다...' : '출금 동의 철회'}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
