import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const check = await prisma.check.findUnique({ where: { id } });

        if (!check) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

        // Logic to reverse balance impacts if needed? 
        // For simplicity, we just delete and user has to fix balances manually if they delete a processed check.
        // OR better: prevent deleting if status is processed.

        if (check.status === 'Tahsil Edildi' || check.status === 'Ödendi') {
            return NextResponse.json({ success: false, error: 'İşlem görmüş çek silinemez. Önce işlemi geri alın.' }, { status: 400 });
        }

        // If 'Portföyde' (In) -> It credited Customer. We should reverse this?
        // If we delete, it means the check never existed or was wrong. Yes, reverse logic.

        if (check.status === 'Portföyde' || check.status === 'Beklemede') {
            if (check.type === 'In' && check.customerId) {
                // We credited customer (decreased balance). Now we increase it back.
                await prisma.customer.update({
                    where: { id: check.customerId },
                    data: { balance: { increment: check.amount } }
                });
            }
            if (check.type === 'Out' && check.supplierId) {
                // We debited supplier (decreased balance). Now increase it back.
                await prisma.supplier.update({
                    where: { id: check.supplierId },
                    data: { balance: { increment: check.amount } }
                });
            }
        }

        await prisma.check.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
