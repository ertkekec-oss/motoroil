
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, category, amount, date, method } = body; // method is likely kasaId or name

        // Find existing transaction first
        const existingTx = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!existingTx) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        // Only allowed for Expenses for now as per request scope (though general logic holds)
        if (existingTx.type !== 'Expense') {
            // For now, let's allow editing any transaction description/date, but amount change only for Expenses safely
        }

        const newAmount = parseFloat(amount);
        const oldAmount = existingTx.amount;
        const kasaId = existingTx.kasaId;

        // Transaction to update safely
        const updatedTx = await prisma.$transaction(async (tx) => {
            // 1. Revert Old Balance Effect
            // Expense decreases balance, so adding back old amount restores it.
            await tx.kasa.update({
                where: { id: kasaId },
                data: { balance: { increment: oldAmount } }
            });

            // 2. Apply New Balance Effect
            // New expense decreases balance.
            await tx.kasa.update({
                where: { id: kasaId },
                data: { balance: { decrement: newAmount } }
            });

            // 3. Update Transaction Record
            return await tx.transaction.update({
                where: { id },
                data: {
                    description: `Gider: ${title} (${category})`, // Reformat as per original
                    amount: newAmount,
                    date: new Date(date)
                    // If method/kasa changed, logic would be more complex. Assuming same kasa for edit simplicity or user deletes and recreates.
                }
            });
        });

        return NextResponse.json({ success: true, transaction: updatedTx });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get Transaction Details
        const tx = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!tx) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        // 2. Reverse Financial Effect
        if (tx.type === 'Expense') {
            // Expense reduced balance, so we add it back
            await prisma.kasa.update({
                where: { id: tx.kasaId },
                data: { balance: { increment: tx.amount } }
            });
        }
        else if (tx.type === 'Sales' || tx.type === 'Collection') {
            // Sales/Collection increased balance, so we reduce it
            await prisma.kasa.update({
                where: { id: tx.kasaId },
                data: { balance: { decrement: tx.amount } }
            });
        }
        else if (tx.type === 'Payment') {
            // Payment reduced balance, so add back
            await prisma.kasa.update({
                where: { id: tx.kasaId },
                data: { balance: { increment: tx.amount } }
            });
        }

        // 3. Delete Record
        await prisma.transaction.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
