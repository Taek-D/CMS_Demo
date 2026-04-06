'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BillingRunCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    batch_id: string;
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const handleRunBilling = async () => {
    if (!confirm(`${currentMonth} 월 출금 배치를 실행하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/billing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_month: currentMonth }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '출금 실행 중 오류가 발생했습니다.');
      }

      setSuccess(data);
      router.refresh();
    } catch (err: any) {
      setError(err.message || '출금 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">배치 출금 실행</CardTitle>
        <CardDescription>
          이번 달 출금을 일괄 처리합니다
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
              <div className="space-y-2">
                <p>배치가 성공적으로 완료되었습니다!</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">총 건수</p>
                    <p className="font-bold text-lg">{success.total}건</p>
                  </div>
                  <div>
                    <p className="text-gray-600">성공</p>
                    <p className="font-bold text-lg text-green-600">{success.success}건</p>
                  </div>
                  <div>
                    <p className="text-gray-600">실패</p>
                    <p className="font-bold text-lg text-red-600">{success.failed}건</p>
                  </div>
                  <div>
                    <p className="text-gray-600">성공률</p>
                    <p className="font-bold text-lg">
                      {success.total > 0 ? ((success.success / success.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">출금 대상</p>
          <p className="font-medium">출금 동의가 완료된 활성화 스케줄</p>
          <p className="text-sm text-gray-500 mt-2">
            ※ 출금 결과는 85% 확률로 성공, 15% 확률로 실패 시뮬레이션됩니다.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleRunBilling}
          className="w-full"
          disabled={loading}
        >
          {loading ? '처리 중...' : `${currentMonth} 월 출금 실행`}
        </Button>
      </CardFooter>
    </Card>
  );
}
