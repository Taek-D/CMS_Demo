import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccess } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils';
import type { BankAccount, BillingResult, BillingSchedule } from '@/types/database';

const FAIL_REASONS = [
  'Insufficient funds',
  'Account error',
  'Retry limit exceeded',
  'Dormant account',
] as const;

type BillingScheduleWithAccount = BillingSchedule & {
  cms_bank_accounts: Pick<BankAccount, 'id' | 'member_id' | 'consent_status'>;
};

export async function POST(request: NextRequest) {
  try {
    const adminAccess = await getAdminAccess();

    if (adminAccess.kind !== 'ok') {
      return NextResponse.json(
        { error: 'Admin access is required.' },
        { status: adminAccess.kind === 'unauthenticated' ? 401 : 403 }
      );
    }

    const supabase = await createServiceClient();
    const body = (await request.json()) as { batch_month?: string };
    const batchMonth = body.batch_month?.trim();

    if (!batchMonth) {
      return NextResponse.json(
        { error: 'batch_month is required' },
        { status: 400 }
      );
    }

    const { data: existingBatch } = await supabase
      .from('cms_billing_batches')
      .select('id')
      .eq('batch_month', batchMonth)
      .maybeSingle();

    if (existingBatch) {
      return NextResponse.json(
        { error: `A batch for ${batchMonth} already exists.` },
        { status: 400 }
      );
    }

    const { data: schedulesData, error: schedulesError } = await supabase
      .from('cms_billing_schedules')
      .select(`
        *,
        cms_bank_accounts!inner (
          id,
          member_id,
          consent_status
        )
      `)
      .eq('is_active', true)
      .eq('cms_bank_accounts.consent_status', 'consented');

    if (schedulesError) {
      return NextResponse.json(
        { error: schedulesError.message },
        { status: 500 }
      );
    }

    const schedules = (schedulesData as BillingScheduleWithAccount[] | null) ?? [];

    if (schedules.length === 0) {
      return NextResponse.json(
        { error: 'No active consented schedules were found.' },
        { status: 400 }
      );
    }

    const { data: batch, error: batchError } = await supabase
      .from('cms_billing_batches')
      .insert({
        batch_month: batchMonth,
        status: 'processing',
      })
      .select()
      .single();

    if (batchError) {
      const isDuplicateBatch = batchError.code === '23505';

      return NextResponse.json(
        {
          error: isDuplicateBatch
            ? `A batch for ${batchMonth} already exists.`
            : batchError.message,
        },
        { status: isDuplicateBatch ? 400 : 500 }
      );
    }

    if (!batch) {
      return NextResponse.json(
        { error: 'Failed to create billing batch.' },
        { status: 500 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const results: BillingResult[] = [];

    for (const schedule of schedules) {
      const account = schedule.cms_bank_accounts;
      const isSuccess = Math.random() < 0.85;
      const status = isSuccess ? 'success' : 'failed';
      const failReason = isSuccess
        ? null
        : FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];
      const processedAt = new Date().toISOString();

      const { data: result, error: resultError } = await supabase
        .from('cms_billing_results')
        .insert({
          batch_id: batch.id,
          member_id: account.member_id,
          account_id: account.id,
          amount: schedule.amount,
          status,
          fail_reason: failReason,
          processed_at: processedAt,
        })
        .select()
        .single();

      if (resultError) {
        console.error('Result insert error:', resultError);
        continue;
      }

      if (result) {
        results.push(result as BillingResult);
      }

      if (isSuccess) {
        successCount++;
      } else {
        failCount++;
      }
    }

    const { error: updateError } = await supabase
      .from('cms_billing_batches')
      .update({
        status: 'completed',
        total_count: results.length,
        success_count: successCount,
        fail_count: failCount,
      })
      .eq('id', batch.id);

    if (updateError) {
      console.error('Batch update error:', updateError);
    }

    return NextResponse.json({
      batch_id: batch.id,
      total: results.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error: unknown) {
    console.error('Billing run error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to run billing batch.') },
      { status: 500 }
    );
  }
}
