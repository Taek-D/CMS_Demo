import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { decryptAccount, maskAccount } from '@/lib/crypto';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BANK_CODES } from '@/lib/constants';

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const params = await searchParams;
  const search = params.search || '';

  let query = supabase
    .from('cms_members')
    .select(`
      *,
      cms_bank_accounts (
        id,
        bank_code,
        account_number_enc,
        account_holder,
        consent_status,
        consented_at
      )
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: members } = await query;

  // 계좌번호 복호화
  if (members) {
    for (const member of members) {
      if (member.cms_bank_accounts && member.cms_bank_accounts.length > 0) {
        for (const account of member.cms_bank_accounts) {
          try {
            const decrypted = decryptAccount(account.account_number_enc);
            account.masked_account = maskAccount(decrypted);
          } catch {
            account.masked_account = '***';
          }
        }
      }
    }
  }

  const getConsentBadge = (status: string) => {
    switch (status) {
      case 'consented':
        return <Badge className="bg-green-500">동의완료</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500">미동의</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="bg-gray-500">해지</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">회원 관리</h1>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="이름 또는 이메일로 검색"
              defaultValue={search}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              검색
            </button>
          </form>
        </CardContent>
      </Card>

      {/* 회원 목록 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원번호</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>은행</TableHead>
                <TableHead>계좌번호</TableHead>
                <TableHead>예금주</TableHead>
                <TableHead>동의 상태</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => {
                const account = member.cms_bank_accounts?.[0];
                const bankName = account
                  ? BANK_CODES.find((b) => b.code === account.bank_code)?.name || account.bank_code
                  : '-';

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono">{member.member_no}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{bankName}</TableCell>
                    <TableCell className="font-mono">
                      {account ? account.masked_account : '-'}
                    </TableCell>
                    <TableCell>{account?.account_holder || '-'}</TableCell>
                    <TableCell>
                      {account ? getConsentBadge(account.consent_status) : <Badge variant="outline">미등록</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {(!members || members.length === 0) && (
            <div className="py-12 text-center text-gray-500">
              조회된 회원이 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
