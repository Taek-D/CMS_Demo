import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // 회원 정보 조회
  const { data: member } = await supabase
    .from('cms_members')
    .select('*')
    .eq('id', user.id)
    .single();

  // 계좌 정보 조회
  const { data: accounts } = await supabase
    .from('cms_bank_accounts')
    .select('*')
    .eq('member_id', user.id);

  // 최근 결제 내역 조회
  const { data: recentPayments } = await supabase
    .from('cms_billing_results')
    .select('*')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const account = accounts?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">성공</Badge>;
      case 'failed':
        return <Badge variant="destructive">실패</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500">처리중</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {member?.name} 회원님, 환영합니다
        </h1>
        <p className="text-gray-600 mt-1">회원번호: {member?.member_no}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 계좌 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>계좌 상태</CardTitle>
            <CardDescription>등록된 계좌 정보</CardDescription>
          </CardHeader>
          <CardContent>
            {account ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">은행</p>
                  <p className="font-medium">{account.bank_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">예금주</p>
                  <p className="font-medium">{account.account_holder}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">출금 동의 상태</p>
                  <div className="mt-1">{getStatusBadge(account.consent_status)}</div>
                </div>
                <Link href="/account">
                  <Button variant="outline" className="w-full mt-2">
                    계좌 관리
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">아직 등록된 계좌가 없습니다</p>
                <Link href="/account">
                  <Button>계좌 등록하기</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/account">
              <Button variant="outline" className="w-full">
                계좌 등록/조회
              </Button>
            </Link>
            <Link href="/consent">
              <Button variant="outline" className="w-full">
                출금 동의 관리
              </Button>
            </Link>
            <Link href="/payments">
              <Button variant="outline" className="w-full">
                결제 내역 조회
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 최근 결제 내역 */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>최근 결제 내역</CardTitle>
            <CardDescription>최근 5건의 결제 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(payment.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.amount.toLocaleString()}원
                      </p>
                    </div>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                ))}
                <Link href="/payments">
                  <Button variant="link" className="w-full">
                    전체 내역 보기 →
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">아직 결제 내역이 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
