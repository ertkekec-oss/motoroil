
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

        const setting = await prisma.appSettings.findUnique({
            where: { companyId_key: { companyId: company.id, key: 'field_sales_config' } }
        });

        return NextResponse.json({
            success: true,
            config: setting?.value || { maxDistance: 1500, allowOutOfRange: true }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user.user || auth.user;

        const body = await req.json();
        const { config } = body;

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        await prisma.appSettings.upsert({
            where: { companyId_key: { companyId: company.id, key: 'field_sales_config' } },
            update: { value: config },
            create: { companyId: company.id, key: 'field_sales_config', value: config }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
