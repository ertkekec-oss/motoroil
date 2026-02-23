
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user.user || auth.user;

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        const requests = await (prisma as any).customerLocationRequest.findMany({
            where: { companyId: company.id },
            include: {
                customer: { select: { name: true, address: true, lat: true, lng: true } },
                staff: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, requests });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
