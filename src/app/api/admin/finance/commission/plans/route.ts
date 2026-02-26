import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getCommissionPlansList, createCommissionPlan } from '@/services/admin/finance/commissionPlans';

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);

        const url = new URL(req.url);
        const cursor = url.searchParams.get('cursor') || undefined;

        const result = await getCommissionPlansList(cursor);
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error: ' + e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const adminUser = await requirePlatformFinanceAdmin(req);

        const body = await req.json();
        // Assume simple validation handled by controller or caller for now
        if (!body.name || !body.currency || !body.effectiveFrom || !body.scope || !body.rules || !Array.isArray(body.rules)) {
            return NextResponse.json({ ok: false, error: 'Missing required fields for commission plan formulation.' }, { status: 400 });
        }
        body.effectiveFrom = new Date(body.effectiveFrom);

        const result = await createCommissionPlan(adminUser.id, body);
        return NextResponse.json({ ok: true, data: result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error: ' + e.message }, { status: 500 });
    }
}
