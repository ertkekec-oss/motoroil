import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmuyor' }, { status: 403 });
        }

        const id = params.id;

        const membership = await prisma.dealerMembership.findUnique({
            where: { id: id, tenantId: tenantId }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Bayi kaydı bulunamadı.' }, { status: 404 });
        }

        // Hard-delete membership. The dealerUser and dealerCompany persist, but access to this tenant is revoked.
        await prisma.dealerMembership.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true, message: 'Bayi başarıyla silindi.' });
    } catch (error: any) {
        console.error('[Dealer DELETE] Error:', error);
        return NextResponse.json({ error: 'Silme işlemi sırasında bir hata oluştu.' }, { status: 500 });
    }
}
