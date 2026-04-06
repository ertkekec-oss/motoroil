import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const s = await prisma.appSettings.findFirst({ where: { key: 'SYSTEM_RATE_LIMITS' }});
    return NextResponse.json(s?.value || { unauthRps: 10, authRps: 100, idempWindow: 24 });
}

export async function POST(req: Request) {
    const session: any = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized'}, {status: 401});
    const body = await req.json();
    await prisma.appSettings.upsert({
        where: { companyId_key: { companyId: 'PLATFORM_ADMIN', key: 'SYSTEM_RATE_LIMITS' } },
        create: { companyId: 'PLATFORM_ADMIN', key: 'SYSTEM_RATE_LIMITS', value: body },
        update: { value: body }
    });
    return NextResponse.json({success: true});
}
