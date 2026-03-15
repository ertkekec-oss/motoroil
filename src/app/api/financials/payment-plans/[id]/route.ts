import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    const { id } = await params;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const plan = await prisma.paymentPlan.findUnique({
            where: { id, companyId: company.id }
        });

        if (!plan) {
            return NextResponse.json({ success: false, error: 'Plan bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }
        
        if (plan.status === 'İptal') {
            return NextResponse.json({ success: false, error: 'Plan zaten iptal edilmiş.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Cancel plan
            await tx.paymentPlan.update({
                where: { id },
                data: { status: 'İptal' }
            });

            // Cancel associated pending installments
            await tx.installment.updateMany({
                where: { paymentPlanId: id, status: 'Pending' },
                data: { status: 'Cancelled' }
            });
        });

        return NextResponse.json({ success: true, message: 'Plan iptal edildi.' });
    } catch (error: any) {
        console.error('Payment Plan Cancel Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
