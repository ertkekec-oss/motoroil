import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectMarketSignalForAdmin } from '@/services/network/projection/marketProjection';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession();

    // In a real app we'd verify admin role here

    const signal = await prisma.networkMarketSignal.findUnique({
        where: { id: params.id }
    });

    if (!signal) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
        data: projectMarketSignalForAdmin(signal as any)
    });
}
