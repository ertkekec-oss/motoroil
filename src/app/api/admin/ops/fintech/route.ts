import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const s = await prisma.appSettings.findFirst({ where: { key: 'FINTECH_ROUTING' }});
    return NextResponse.json(s?.value || { defaultProvider: 'PAYTR', useFallback: true, absorbCommissions: false });
}

export async function POST(req: Request) {
    const session: any = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized'}, {status: 401});
    const body = await req.json();
    await prisma.appSettings.upsert({
        where: { companyId_key: { companyId: 'PLATFORM_ADMIN', key: 'FINTECH_ROUTING' } },
        create: { companyId: 'PLATFORM_ADMIN', key: 'FINTECH_ROUTING', value: body },
        update: { value: body }
    });
    return NextResponse.json({success: true});
}
