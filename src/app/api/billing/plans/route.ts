
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getRequestContext } from '@/lib/api-context';


export async function GET(req: NextRequest) {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                features: { include: { feature: true } },
                limits: true,
                _count: { select: { subscriptions: true } }
            },
            orderBy: {
                price: 'asc'
            }
        });

        // Frontend'in işleyebileceği temiz format
        const formattedPlans = plans.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            limits: p.limits.map(l => ({
                resource: l.resource,
                limit: l.limit
            })),
            features: p.features.map(f => ({
                id: f.featureId,
                key: f.feature.key,
                name: f.feature.name
            })),
            price: Number(p.price),
            currency: p.currency,
            interval: p.interval,
            isActive: p.isActive,
            members: p._count.subscriptions
        }));

        return NextResponse.json(formattedPlans);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, price, currency, interval, limits, features } = body;

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'İsim ve fiyat zorunludur' }, { status: 400 });
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                price: Number(price),
                currency: currency || 'TRY',
                interval: interval || 'MONTHLY',
                isActive: true,
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

        return NextResponse.json({ success: true, plan });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
