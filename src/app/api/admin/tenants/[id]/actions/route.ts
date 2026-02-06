
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        // Sadece SUPER_ADMIN yetkisi
        if (!session || session.role?.toUpperCase() !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Requires SUPER_ADMIN' }, { status: 403 });
        }

        const { id: tenantId } = await paramsPromise;
        const { action, payload } = await req.json();

        const subscription = await (prisma as any).subscription.findUnique({ where: { tenantId } });
        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        switch (action) {
            case 'CHANGE_PLAN':
                // payload: { planId, reason }
                await (prisma as any).subscription.update({
                    where: { id: subscription.id },
                    data: { planId: payload.planId }
                });
                break;

            case 'EXTEND_TRIAL':
                // payload: { days }
                const currentEnd = new Date(subscription.endDate);
                const newEnd = new Date(currentEnd.setDate(currentEnd.getDate() + (payload.days || 7)));
                await (prisma as any).subscription.update({
                    where: { id: subscription.id },
                    data: {
                        endDate: newEnd,
                        status: 'TRIAL' // Force status back to trial if needed
                    }
                });
                break;

            case 'SET_STATUS':
                // payload: { status }
                await (prisma as any).subscription.update({
                    where: { id: subscription.id },
                    data: { status: payload.status }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log Action
        await (prisma as any).subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                action: `ADMIN_${action}`,
                newPlanId: action === 'CHANGE_PLAN' ? payload.planId : subscription.planId,
                prevPlanId: subscription.planId
            }
        });

        return NextResponse.json({ success: true, message: `Action ${action} completed.` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
