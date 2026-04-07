import Link from 'next/link';

import { requireAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export function buildDashboardChildrenSummary(count: number) {
  return {
    title: 'Children',
    description: 'Manage children linked to your member account.',
    href: '/children',
    count,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'consented':
      return <Badge className="bg-green-500">Consented</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 text-black">Pending</Badge>;
    case 'revoked':
      return <Badge variant="outline">Revoked</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-500">Success</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'pending':
      return <Badge className="bg-blue-500">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [memberResult, accountsResult, recentPaymentsResult, childrenResult] =
    await Promise.all([
      supabase.from('cms_members').select('*').eq('id', user.id).single(),
      supabase.from('cms_bank_accounts').select('*').eq('member_id', user.id),
      supabase
        .from('cms_billing_results')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('cms_children').select('id').eq('parent_member_id', user.id),
    ]);

  const member = memberResult.data;
  const accounts = accountsResult.data ?? [];
  const recentPayments = recentPaymentsResult.data ?? [];
  const childrenSummary = buildDashboardChildrenSummary(
    childrenResult.data?.length ?? 0
  );
  const account = accounts[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {member?.name ?? 'Member'} Dashboard
        </h1>
        <p className="mt-1 text-gray-600">Member No: {member?.member_no ?? '-'}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Current billing account and consent status.</CardDescription>
          </CardHeader>
          <CardContent>
            {account ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Bank</p>
                  <p className="font-medium">{account.bank_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Holder</p>
                  <p className="font-medium">{account.account_holder}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Consent</p>
                  <div className="mt-1">{getStatusBadge(account.consent_status)}</div>
                </div>
                <Link href="/account">
                  <Button variant="outline" className="mt-2 w-full">
                    Manage account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-500">No account has been registered yet.</p>
                <Link href="/account">
                  <Button className="w-full">Register account</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{childrenSummary.title}</CardTitle>
            <CardDescription>{childrenSummary.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-sm text-gray-600">Registered children</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {childrenSummary.count}
              </p>
            </div>
            <Link
              href="/children"
              className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Manage children
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Open common member tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/account">
              <Button variant="outline" className="w-full">
                Manage account
              </Button>
            </Link>
            <Link href="/consent">
              <Button variant="outline" className="w-full">
                Manage consent
              </Button>
            </Link>
            <Link href="/payments">
              <Button variant="outline" className="w-full">
                View payments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest five billing results.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(payment.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.amount.toLocaleString()} KRW
                      </p>
                    </div>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                ))}
                <Link href="/payments">
                  <Button variant="link" className="w-full">
                    View all payments
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">No payment history yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
