import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: any }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Bu islem icin b2b_manage yetkisi gereklidir' }, { status: 403 });
        }

        const body = await req.json();

        const resolvedParams = await Promise.resolve(params);
        const membershipId = resolvedParams.id;

        const updateData: any = {};
        if (body.creditLimit !== undefined) {
            updateData.creditLimit = Number(body.creditLimit) || 0;
        }
        if (body.categoryId !== undefined) {
            updateData.categoryId = body.categoryId === "" ? null : body.categoryId;
        }

        await prisma.dealerMembership.update({
            where: {
                id: membershipId,
                tenantId: tenantId
            },
            data: updateData
        });

        console.log(`[Credit] Modifying limit for ${membershipId} at tenant ${tenantId} by ${user.id}`);

        return NextResponse.json({ success: true, message: `Kredi limiti güncellendi`, limit: body.creditLimit });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
