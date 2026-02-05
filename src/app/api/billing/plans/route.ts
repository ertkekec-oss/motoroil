
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            include: {
                features: { include: { feature: true } },
                limits: true
            },
            orderBy: {
                // Fiyat alanı henüz Plan modelinde yok, simulated order
                name: 'asc' // Standart -> Pro -> Enterprise sıralaması varsayıyoruz veya DB'de order field olmalı.
            }
        });

        // Frontend'in işleyebileceği temiz format
        const formattedPlans = plans.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            limits: p.limits.reduce((acc: any, l) => {
                acc[l.resource] = l.limit === -1 ? 'Sınırsız' : l.limit;
                return acc;
            }, {}),
            features: p.features.map(f => f.feature.name),
            price: Number(p.price), // Decimal to Number
            currency: p.currency,
            interval: p.interval.toLowerCase() // MONTHLY -> monthly
        }));

        return NextResponse.json(formattedPlans);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
