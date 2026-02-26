import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { activateCommissionPlan } from '@/services/admin/finance/commissionPlans';

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const adminUser = await requirePlatformFinanceAdmin(req);

        const result = await activateCommissionPlan(adminUser.id, params.id);
        return NextResponse.json({ ok: true, data: result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        if (e.message.includes('not found')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error: ' + e.message }, { status: 500 });
    }
}
