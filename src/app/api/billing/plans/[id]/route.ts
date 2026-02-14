
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await paramsPromise;
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const plan = await prisma.plan.findUnique({
            where: { id },
            include: {
                features: { include: { feature: true } },
                limits: true
            }
        });

        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        return NextResponse.json(plan);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await paramsPromise;
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, price, currency, interval, limits, features, isActive } = body;

        // Transaction to update plan and its relations
        const updatedPlan = await prisma.$transaction(async (tx) => {
            // Delete existing limits and features
            await tx.planLimit.deleteMany({ where: { planId: id } });
            await tx.planFeature.deleteMany({ where: { planId: id } });

            // Update plan
            return await tx.plan.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: price !== undefined ? Number(price) : undefined,
                    currency,
                    interval,
                    isActive,
                    limits: {
                        create: Object.entries(limits || {}).map(([resource, limit]) => ({
                            resource,
                            limit: Number(limit)
                        }))
                    },
                    features: {
                        create: (features || []).map((featureId: string) => ({
                            featureId: featureId
                        }))
                    }
                },
                include: { limits: true, features: true }
            });
        });

        return NextResponse.json({ success: true, plan: updatedPlan });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Plan Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await paramsPromise;
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // We should check if there are active subscriptions before deleting
        const subCount = await prisma.subscription.count({
            where: { planId: id }
        });

        if (subCount > 0) {
            return NextResponse.json({ error: 'Bu pakete bağlı aktif üyeler olduğu için silinemez. Önce üyeleri başka pakete taşıyın veya paketi pasife alın.' }, { status: 400 });
        }

        await prisma.plan.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Plan Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
