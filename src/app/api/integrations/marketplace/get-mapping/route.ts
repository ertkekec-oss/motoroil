import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true }
        });
        
        if (!company) {
             return NextResponse.json({ success: false, error: 'Firma bulunamadı' }, { status: 404 });
        }

        const mappings = await prisma.marketplaceProductMap.findMany({
            where: { companyId: company.id }
        });

        return NextResponse.json({ success: true, mappings });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
