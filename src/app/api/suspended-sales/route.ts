import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all suspended sales
export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) return NextResponse.json([], { status: 200 });

        const sales = await prisma.suspendedSale.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(sales);
    } catch (error: any) {
        console.error('[API_SUSPENDED_SALES_GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// CREATE a suspended sale
export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) throw new Error('Firma yetkisi bulunamadı.');

        const data = await request.json();
        const sale = await prisma.suspendedSale.create({
            data: {
                companyId,
                label: data.label,
                items: data.items,
                customer: data.customer,
                total: data.total,
                branch: data.branch
            }
        });
        return NextResponse.json(sale);
    } catch (error: any) {
        console.error('[API_SUSPENDED_SALES_POST]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a suspended sale
export async function DELETE(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) throw new Error('Firma yetkisi bulunamadı.');

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('ID is required');

        const userId = user.id || 'unknown';
        const userName = user.name || 'Unknown';

        // Get details before delete for log
        // Get details before delete for log
        // Use findFirst instead of findUnique because (id, companyId) is not a unique constraint
        const sale = await prisma.suspendedSale.findFirst({
            where: { id, companyId }
        });

        if (!sale) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı.' }, { status: 404 });
        }

        await prisma.suspendedSale.delete({
            where: { id }
        });

        // Log the cancellation
        await prisma.auditLog.create({
            data: {
                action: 'CANCEL_SALE',
                entity: 'SuspendedSale',
                entityId: id,
                userId,
                userName,
                details: `Cancelled suspended sale: ${sale.label} (Total: ${sale.total})`,
                tenantId: user.tenantId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API_SUSPENDED_SALES_DELETE]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
