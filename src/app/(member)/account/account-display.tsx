'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BANK_CODES } from '@/lib/constants';
import { maskAccount } from '@/lib/crypto';
import { deleteAccount } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function AccountDisplay({ account, decryptedAccountNumber }: AccountDisplayProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bankName = BANK_CODES.find((b) => b.code === account.bank_code)?.name || account.bank_code;
  const maskedAccount = maskAccount(decryptedAccountNumber);

  const getStatusBadge = () => {
    switch (account.consent_status) {
      case 'consented':
        return <Badge className="bg-green-500">동의완료</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500">미동의</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="bg-gray-500">해지</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 계좌를 삭제하시겠습니까? 출금 동의도 함께 취소됩니다.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAccount(account.id);
      if (result.success) {
        alert('계좌가 삭제되었습니다.');
        router.push('/account');
        router.refresh();
      } else {
        setError(result.error || '계좌 삭제 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '계좌 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">등록된 계좌 정보</CardTitle>
        <CardDescription>
          현재 등록된된 계좌입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">은행</span>
            <span className="font-medium">{bankName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">계좌번호</span>
            <span className="font-mono font-medium">{maskedAccount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">예금주</span>
            <span className="font-medium">{account.account_holder}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">출금 동의 상태</span>
            {getStatusBadge()}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">등록일</span>
            <span className="text-sm">
              {new Date(account.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? '삭제 중...' : '계좌 삭제'}
        </Button>
      </CardContent>
    </Card>
  );
}
