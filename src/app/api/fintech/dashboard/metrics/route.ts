import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { ReconciliationMetricsService } from '@/services/fintech/reconciliation-metrics.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        if (!ctx.companyId && ctx.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Oturum veya şirket bilgisi eksik' }, { status: 401 });
        }

        const metrics = await ReconciliationMetricsService.getControlTowerMetrics(ctx.companyId || '');

        return NextResponse.json({
            success: true,
            data: metrics
        });

    } catch (error: any) {
        console.error('Fintech Control Tower API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
