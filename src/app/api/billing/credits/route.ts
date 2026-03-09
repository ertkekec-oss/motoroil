import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;

        // Ensure tenant credits exist
        let credits = await prisma.tenantCredit.findUnique({
            where: { tenantId }
        });

        if (!credits && tenantId !== 'PLATFORM_ADMIN') {
            credits = await prisma.tenantCredit.create({
                data: { tenantId }
            });
        }

        return NextResponse.json({ success: true, data: credits });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
