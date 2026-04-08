import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { count: totalMembers } = await supabase
    .from('cms_members')
    .select('*', { count: 'exact', head: true });

  const { count: totalAccounts } = await supabase
    .from('cms_bank_accounts')
    .select('*', { count: 'exact', head: true });

  const { count: consentedAccounts } = await supabase
    .from('cms_bank_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('consent_status', 'consented');

  const { data: latestBatch } = await supabase
    .from('cms_billing_batches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const stats = [
    { label: '총 회원 수', value: totalMembers || 0, color: 'text-blue-600' },
    { label: '등록된 계좌', value: totalAccounts || 0, color: 'text-green-600' },
    { label: '출금 동의 완료', value: consentedAccounts || 0, color: 'text-indigo-600' },
    {
      label: '마지막 배치 월',
      value: latestBatch?.batch_month || '-',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">관리자 대시보드</h1>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/members">
              <button className="w-full rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100">
                <p className="font-medium">회원 관리</p>
                <p className="text-sm text-gray-600">전체 회원 목록 및 계좌 조회</p>
              </button>
            </Link>
            <Link href="/admin/billing">
              <button className="w-full rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100">
                <p className="font-medium">배치 출금 실행</p>
                <p className="text-sm text-gray-600">이번 달 출금 일괄 처리</p>
              </button>
            </Link>
            <Link href="/admin/results">
              <button className="w-full rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100">
                <p className="font-medium">출금 결과 조회</p>
                <p className="text-sm text-gray-600">배치별 출금 결과 확인</p>
              </button>
            </Link>
            <Link href="/admin/overdue">
              <button className="w-full rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100">
                <p className="font-medium">Overdue Management</p>
                <p className="text-sm text-gray-600">
                  Review failed billing rows and export scoped statements
                </p>
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 배치 결과</CardTitle>
          </CardHeader>
          <CardContent>
            {latestBatch ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">배치 월: {latestBatch.batch_month}</p>
                <p className="text-sm text-gray-600">상태: {latestBatch.status}</p>
                <p className="text-sm text-gray-600">
                  총 {latestBatch.total_count}건 | 성공 {latestBatch.success_count}건 | 실패{' '}
                  {latestBatch.fail_count}건
                </p>
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                아직 실행된 배치가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
