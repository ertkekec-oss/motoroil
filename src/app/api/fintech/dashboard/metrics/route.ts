import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ReconciliationMetricsService } from '@/services/fintech/reconciliation-metrics.service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Oturum veya şirket bilgisi eksik' }, { status: 401 });
        }

        const metrics = await ReconciliationMetricsService.getControlTowerMetrics(session.user.companyId);

        return NextResponse.json({
            success: true,
            data: metrics
        });

    } catch (error: any) {
        console.error('Fintech Control Tower API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
