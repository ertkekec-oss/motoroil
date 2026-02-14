
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        // Get user/staff to find tenantId
        let tenantId = session.tenantId;

        if (!tenantId) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.id },
                select: { tenantId: true }
            });
            if (user) tenantId = user.tenantId;
            else {
                const staff = await (prisma as any).staff.findUnique({
                    where: { id: session.id },
                    select: { tenantId: true }
                });
                if (staff) tenantId = staff.tenantId;
            }
        }

        if (!tenantId || tenantId === 'PLATFORM_ADMIN') {
            // Platform admins have all features
            const allFeatures = await prisma.feature.findMany();
            return NextResponse.json({
                plan: { name: 'Super Admin' },
                features: allFeatures.map(f => f.key),
                status: 'ACTIVE'
            });
        }

        const subscription = await (prisma as any).subscription.findUnique({
            where: { tenantId },
            include: {
                plan: {
                    include: {
                        features: {
                            include: {
                                feature: true
                            }
                        }
                    }
                }
            }
        });

        if (!subscription) {
            return NextResponse.json({ error: 'No subscription' }, { status: 404 });
        }

        return NextResponse.json({
            plan: {
                id: subscription.plan.id,
                name: subscription.plan.name
            },
            features: subscription.plan.features.map((f: any) => f.feature.key),
            status: subscription.status
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
