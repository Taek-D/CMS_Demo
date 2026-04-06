'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { giveConsent, revokeConsent } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentProps {
  account: {
    id: string;
    consent_status: 'pending' | 'consented' | 'revoked';
    consented_at: string | null;
    bank_code: string;
    account_holder: string;
  } | null;
}

export default function ConsentCard({ account }: ConsentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(account?.consent_status || 'none');

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
      } else {
        setError(result.error || '출금 동의 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '출금 동의 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    if (!confirm('정말 출금 동의를 취소하시겠습니까?')) {
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
      } else {
        setError(result.error || '출금 동의 취소 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '출금 동의 취소 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'consented':
        return <Badge className="bg-green-500 text-lg px-3 py-1">동의완료</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-lg px-3 py-1">미동의</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="bg-gray-500 text-lg px-3 py-1">해지</Badge>;
      case 'none':
        return <Badge variant="outline" className="text-lg px-3 py-1">계좌 미등록</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'consented':
        return '출금 동의가 완료된 상태입니다. 자동이체가 정상적으로 진행됩니다.';
      case 'pending':
        return '아직 출금 동의를 하지 않았습니다. 동의를 진행해주세요.';
      case 'revoked':
        return '출금 동의가 해지된 상태입니다. 재동의를 진행해주세요.';
      case 'none':
        return '아직 등록된 계좌가 없습니다. 먼저 계좌를 등록해주세요.';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">출금 동의 관리</CardTitle>
        <CardDescription>
          자동이체 출금에 대한 동의 상태를 확인하고 관리하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              처리가 완료되었습니다!
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center py-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">현재 상태</p>
            {getStatusBadge(currentStatus)}
          </div>
          
          {account?.consented_at && currentStatus === 'consented' && (
            <p className="text-sm text-gray-500">
              동의일: {new Date(account.consented_at).toLocaleDateString('ko-KR')}
            </p>
          )}

          <p className="text-gray-700">{getStatusMessage(currentStatus)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {(currentStatus === 'pending' || currentStatus === 'revoked' || currentStatus === 'none') && (
          <Button
            className="w-full"
            onClick={handleGiveConsent}
            disabled={loading || currentStatus === 'none'}
          >
            {loading ? '처리 중...' : '출금 동의하기'}
          </Button>
        )}
        {currentStatus === 'consented' && (
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleRevokeConsent}
            disabled={loading}
          >
            {loading ? '처리 중...' : '출금 동의 취소'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
