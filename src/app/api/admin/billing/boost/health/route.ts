import { NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        await requirePlatformFinanceAdmin();
        
        const snapshots = await prisma.billingHealthSnapshot.findMany({
            orderBy: { day: 'desc' },
            take: 30
        });
        
        return NextResponse.json(snapshots);
    } catch(e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
