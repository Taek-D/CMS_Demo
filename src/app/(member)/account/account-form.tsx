'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, LockKeyhole, UserRound } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BANK_CODES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';

import { registerAccount } from './actions';

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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        return;
      }

      setError(result.error || '계좌를 등록하는 중 문제가 발생했습니다.');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, '계좌를 등록하는 중 문제가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-4">
        <span className="section-eyebrow">신규 계좌 등록</span>
        <CardTitle className="text-[1.9rem]">자동이체에 사용할 계좌 정보를 입력해 주세요</CardTitle>
        <CardDescription className="leading-7">
          실제 출금에 사용하는 보호자 계좌를 등록하는 단계입니다. 등록 후에는 동의
          관리 화면에서 자동이체 동의를 이어서 진행할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <AlertDescription>계좌를 등록했습니다. 이제 출금 동의를 진행해 주세요.</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="bank_code">은행 선택</Label>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="bank_code"
                name="bank_code"
                value={formData.bank_code}
                onChange={handleChange}
                required
                className="flex h-12 w-full rounded-[1rem] border border-border/70 bg-background/90 pl-11 pr-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">은행을 선택해 주세요</option>
                {BANK_CODES.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    ({bank.code}) {bank.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number">계좌번호</Label>
            <Input
              id="account_number"
              name="account_number"
              type="text"
              placeholder="숫자만 입력해 주세요"
              value={formData.account_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder">예금주명</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="account_holder"
                name="account_holder"
                type="text"
                placeholder="예금주명을 입력해 주세요"
                value={formData.account_holder}
                onChange={handleChange}
                required
                className="pl-11"
              />
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-border/70 bg-[color:var(--surface-strong)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <LockKeyhole className="size-4" />
              </div>
              <div>
                <p className="font-medium text-[color:var(--brand-ink)]">보안 저장 안내</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  입력한 계좌 정보는 암호화되어 저장되며, 화면에서는 일부 숫자만 표시됩니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? '계좌를 등록하는 중입니다...' : '계좌 등록'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
