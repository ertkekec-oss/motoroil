import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmuyor' }, { status: 403 });
        }

        const membership = await prisma.dealerMembership.findFirst({
            where: { id: id, tenantId: tenantId }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Bayi kaydı bulunamadı.' }, { status: 404 });
        }

        const membershipId = id;

        // Siparişleri kontrol et. Varsa silme, sadece askıya al (SUSPENDED)
        const ordersCount = await prisma.order.count({
            where: { dealerMembershipId: membershipId }
        });

        if (ordersCount > 0) {
            await prisma.dealerMembership.update({
                where: { id: membershipId },
                data: { status: 'SUSPENDED' }
            });
            return NextResponse.json({ success: true, message: 'Bayiye ait geçmiş siparişler olduğu için tamamen silinmek yerine erişimi sonlandırıldı (ASKIYA ALINDI).' });
        }

        // Hard-delete
        // Önce sepetleri ve denemeleri şartsız sil (constraint hatası vermemesi için)
        await prisma.dealerCart.deleteMany({
            where: { membershipId: membershipId }
        });
        await prisma.dealerCheckoutAttempt.deleteMany({
            where: { membershipId: membershipId }
        });

        // Ve en son üyeliği sil
        await prisma.dealerMembership.delete({
            where: { id: membershipId }
        });

        return NextResponse.json({ success: true, message: 'Bayi ve tüm B2B ön belleği kalıcı olarak silindi.' });
    } catch (error: any) {
        console.error('[Dealer DELETE] Error:', error);
        return NextResponse.json({ error: 'Silme işlemi sırasında bir hata oluştu.' }, { status: 500 });
    }
}
