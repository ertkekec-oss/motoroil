import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectMarketSignalForTenant } from '@/services/network/projection/marketProjection';

export async function GET(request: NextRequest) {
    const user = await getSession();

    // Heat/radar representation grouped by category
    const signals = await prisma.networkMarketSignal.findMany({
        where: {
            status: 'ACTIVE',
            isStale: false,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        },
        orderBy: { intensityScore: 'desc' }
    });

    const categories = Array.from(new Set(signals.map(s => s.categoryId).filter(Boolean)));
    const heatData = categories.map(cat => {
        const catSignals = signals.filter(s => s.categoryId === cat);
        const topSignal = catSignals[0]; // Already ordered by intensity
        return {
            categoryId: cat,
            maxIntensity: topSignal.intensityScore,
            trendDirection: topSignal.trendDirection,
            confidence: topSignal.confidenceScore,
            primarySignal: projectMarketSignalForTenant(topSignal)
        };
    });

    return NextResponse.json({
        data: heatData
    });
}
