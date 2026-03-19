import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

        const memberships = await prisma.dealerMembership.findMany({
            where: {
                tenantId: tenantId
            },
            include: {
                dealerCompany: true,
                dealerUser: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Fetch associated customers by matching tax numbers
        const taxNumbers = memberships.map(m => m.dealerCompany?.taxNumber).filter(Boolean) as string[];
        
        const matchingCustomers = await prisma.customer.findMany({
            where: {
                company: { tenantId: tenantId },
                taxNumber: { in: taxNumbers }
            },
            select: { id: true, taxNumber: true }
        });

        const customerMap = new Map(matchingCustomers.map(c => [c.taxNumber, c.id]));

        const formattedDealers = memberships.map((m: any) => ({
            id: m.id,
            dealerName: m.dealerCompany?.companyName || m.dealerUser?.email || 'İsimsiz Bayi',
            taxNumber: m.dealerCompany?.taxNumber || '-',
            status: m.status,
            creditLimit: Number(m.creditLimit),
            customerId: m.dealerCompany?.taxNumber ? customerMap.get(m.dealerCompany.taxNumber) : null
        }));

        return NextResponse.json({ success: true, data: formattedDealers });
    } catch (error: any) {
        console.error('[Dealers GET] Error:', error);
        return NextResponse.json({ error: 'Bayiler getirilirken bir hata oluştu.' }, { status: 500 });
    }
}
