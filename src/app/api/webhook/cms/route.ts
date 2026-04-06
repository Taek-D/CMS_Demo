import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { result_id, status, fail_reason, processed_at } = body;

    if (!result_id || !status) {
      return NextResponse.json(
        { error: 'result_id and status are required' },
        { status: 400 }
      );
    }

    if (!['success', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "success" or "failed"' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cms_billing_results')
      .update({
        status,
        fail_reason: fail_reason || null,
        processed_at: processed_at || new Date().toISOString(),
      })
      .eq('id', result_id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
