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

export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('회원 정보를 만들지 못했습니다.');
      }

      if (authData.session) {
        await supabase.auth.signOut();
      }

      window.alert(
        authData.session
          ? '회원가입이 완료되었습니다.'
          : '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.'
      );
      router.push('/login');
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, '회원가입을 완료하지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="section-eyebrow">가족 계정 만들기</span>
          <CardTitle className="text-[1.9rem]">학부모 계정을 등록하세요</CardTitle>
          <CardDescription className="max-w-sm leading-6">
            기본 학부모 정보를 등록한 뒤 자녀 연결, 계좌 등록, 자동이체 동의로 이어집니다.
          </CardDescription>
        </div>
        <div className="rounded-[1.35rem] border border-border/70 bg-accent/55 px-4 py-3 text-sm leading-6 text-muted-foreground">
          가입 첫 화면부터 금융 서비스처럼 차갑지 않고, 실제 돌봄 서비스처럼 신뢰감 있게 보이도록 구성했습니다.
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
            <Label htmlFor="name">학부모 이름</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="예: 이민아"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 (6자 이상)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? '계정 생성 중...' : '회원가입'}
          </Button>
          <p className="text-center text-sm leading-6 text-muted-foreground">
            이미 계정이 있나요?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인으로 이동
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
