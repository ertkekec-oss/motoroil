import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { installmentId, kasaId } = await request.json();

        if (!installmentId || !kasaId) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });

        const installment = await prisma.installment.findUnique({
            where: { id: installmentId },
            include: { paymentPlan: true }
        });

        if (!installment || installment.status === 'Paid') {
            return NextResponse.json({ error: 'Taksit bulunamadı veya zaten ödenmiş' }, { status: 400 });
        }

        // Transactional Operation
        const result = await prisma.$transaction(async (tx) => {
            const direction = installment.paymentPlan.direction || 'OUT';
            const isCollection = direction === 'IN';

            // 1. Create Transaction (Collection or Payment)
            const transaction = await tx.transaction.create({
                data: {
                    type: isCollection ? 'Collection' : 'Payment',
                    amount: installment.amount,
                    description: `${installment.paymentPlan.title} - Taksit ${installment.installmentNo}/${installment.paymentPlan.installmentCount} (${isCollection ? 'Tahsilat' : 'Ödeme'})`,
                    kasaId: kasaId,
                    date: new Date(),
                    branch: installment.paymentPlan.branch || 'Merkez'
                }
            });

            // 2. Update Kasa Balance (Increment or Decrement)
            // Note: Using 'balance' field. If schema uses 'amount', this needs to be adjusted.
            // Based on frontend usage, 'balance' is the correct field name.
            await tx.kasa.update({
                where: { id: kasaId },
                data: { balance: { [isCollection ? 'increment' : 'decrement']: installment.amount } }
            });

            // 3. Mark Installment as Paid
            const updatedInstallment = await tx.installment.update({
                where: { id: installmentId },
                data: {
                    status: 'Paid',
                    paidAt: new Date(),
                    transactionId: transaction.id
                }
            });

            // 4. Check if Plan is Completed
            const pendingCount = await tx.installment.count({
                where: { paymentPlanId: installment.paymentPlanId, status: 'Pending' }
            });

            if (pendingCount === 0) {
                await tx.paymentPlan.update({
                    where: { id: installment.paymentPlanId },
                    data: { status: 'Completed' }
                });
            }

            return updatedInstallment;
        });

        return NextResponse.json({ success: true, installment: result });

    } catch (e: any) {
        console.error("Payment Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
