
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { calculateUpsellSignal } from '@/lib/upsell-engine';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const tenants = await (prisma as any).tenant.findMany({
            include: {
                subscription: { include: { plan: true } },
                _count: { select: { companies: true, users: true } }
            }
        });

        const radarData = await Promise.all(tenants.map(async (tenant: any) => {
            const signal = await calculateUpsellSignal(tenant.id, 'ADMIN_RADAR');

            let status = 'HEALTHY';
            if (signal?.priority >= 8) status = 'CRITICAL_LIMIT';
            else if (signal?.priority >= 5) status = 'UPSELL_READY';
            else if (signal?.type === 'SOFT') status = 'EXPANSION_CANDIDATE';

            return {
                id: tenant.id,
                name: tenant.name,
                ownerEmail: tenant.ownerEmail,
                currentPlan: tenant.subscription?.plan?.name || 'No Plan',
                status,
                signal: signal ? {
                    type: signal.type,
                    message: signal.message,
                    priority: signal.priority
                } : null,
                metrics: {
                    companies: tenant._count.companies,
                    users: tenant._count.users
                }
            };
        }));

        // Sort by priority
        radarData.sort((a, b) => (b.signal?.priority || 0) - (a.signal?.priority || 0));

        return NextResponse.json(radarData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
