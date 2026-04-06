'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BANK_CODES } from '@/lib/constants';
import { registerAccount } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AccountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bank_code: '',
    account_number: '',
    account_holder: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('bank_code', formData.bank_code);
      form.append('account_number', formData.account_number);
      form.append('account_holder', formData.account_holder);

      const result = await registerAccount(form);

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || '계좌 등록 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '계좌 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">계좌 등록</CardTitle>
        <CardDescription>
          자동이체에 사용할 계좌를 등록하세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">
                계좌가 성공적으로 등록되었습니다!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="bank_code">은행 선택</Label>
            <select
              id="bank_code"
              name="bank_code"
              value={formData.bank_code}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">은행을 선택하세요</option>
              {BANK_CODES.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  ({bank.code}) {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number">계좌번호</Label>
            <Input
              id="account_number"
              name="account_number"
              type="text"
              placeholder="0101234567890"
              value={formData.account_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder">예금주명</Label>
            <Input
              id="account_holder"
              name="account_holder"
              type="text"
              placeholder="홍길동"
              value={formData.account_holder}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '등록 중...' : '계좌 등록'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
