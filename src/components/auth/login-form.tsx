'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw authError;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, '지금은 로그인할 수 없습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="section-eyebrow">다시 오신 것을 환영합니다</span>
          <CardTitle className="text-[1.9rem]">멤버 로그인</CardTitle>
          <CardDescription className="max-w-sm leading-6">
            가족 대시보드, 자동이체 상태, 결제 기록을 이어서 확인할 수 있습니다.
          </CardDescription>
        </div>
        <div className="rounded-[1.35rem] border border-border/70 bg-accent/55 px-4 py-3 text-sm leading-6 text-muted-foreground">
          포트폴리오 데모 계정이나 미리 생성한 멤버 계정으로 바로 체험할 수 있습니다.
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="parent@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          <p className="text-center text-sm leading-6 text-muted-foreground">
            아직 가족 계정이 없나요?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              회원가입하기
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
