import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const FAIL_REASONS = ['잔액부족', '계좌오류', '한도초과', '정지계좌'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { batch_month } = body;

    if (!batch_month) {
      return NextResponse.json(
        { error: 'batch_month is required' },
        { status: 400 }
      );
    }

    // 해당 월 배치가 이미 존재하는지 확인
    const { data: existingBatch } = await supabase
      .from('cms_billing_batches')
      .select('id')
      .eq('batch_month', batch_month)
      .single();

    if (existingBatch) {
      return NextResponse.json(
        { error: `이미 ${batch_month} 월 배치가 존재합니다.` },
        { status: 400 }
      );
    }

    // 출금 대상 조회 (동의 완료 + 활성화된 스케줄)
    const { data: schedules, error: schedulesError } = await supabase
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

    if (!schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: '출금 대상이 없습니다. 출금 동의가 완료된 스케줄을 확인해주세요.' },
        { status: 400 }
      );
    }

    // 배치 생성
    const { data: batch, error: batchError } = await supabase
      .from('cms_billing_batches')
      .insert({
        batch_month,
        status: 'processing',
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: batchError?.message || '배치 생성 실패' },
        { status: 500 }
      );
    }

    // 각 스케줄별 결과 생성 및 시뮬레이션
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const schedule of schedules) {
      const account = (schedule as any).cms_bank_accounts;
      const isSuccess = Math.random() < 0.85; // 85% 성공률
      const status = isSuccess ? 'success' : 'failed';
      const failReason = isSuccess ? null : FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];
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

      results.push(result);

      if (isSuccess) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 배치 집계 업데이트
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
  } catch (error: any) {
    console.error('Billing run error:', error);
    return NextResponse.json(
      { error: error.message || '출금 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
