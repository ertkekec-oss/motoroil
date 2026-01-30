
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, amount, date, description } = body;

        // Find existing transaction first
        const tx = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!tx) {
            return NextResponse.json({ success: false, error: 'İşlem bulunamadı' }, { status: 404 });
        }

        const newAmount = parseFloat(amount.toString());
        const oldAmount = Number(tx.amount);
        const diff = newAmount - oldAmount;

        const updatedTx = await prisma.$transaction(async (prismaTx) => {
            // 1. Update Kasa Balance
            // If it's an inflow (Sales/Collection), increase kasa. If outflow (Expense/Payment), decrease.
            if (tx.type === 'Sales' || tx.type === 'Collection') {
                await prismaTx.kasa.update({
                    where: { id: tx.kasaId },
                    data: { balance: { increment: diff } }
                });
            } else {
                await prismaTx.kasa.update({
                    where: { id: tx.kasaId },
                    data: { balance: { decrement: diff } }
                });
            }

            // 2. Update Customer Balance if applicable
            if (tx.customerId) {
                // If Collection: higher amount means customer owes LESS (decrements balance)
                // If Sales/Payment: higher amount means customer owes MORE (increments balance)
                if (tx.type === 'Collection') {
                    await prismaTx.customer.update({
                        where: { id: tx.customerId },
                        data: { balance: { decrement: diff } }
                    });
                } else if (tx.type === 'Sales' || tx.type === 'Payment') {
                    await prismaTx.customer.update({
                        where: { id: tx.customerId },
                        data: { balance: { increment: diff } }
                    });
                }
            }

            // 3. Update Transaction Record
            return await prismaTx.transaction.update({
                where: { id },
                data: {
                    description: description || tx.description,
                    amount: newAmount,
                    date: date ? new Date(date) : undefined
                }
            });
        });

        return NextResponse.json({ success: true, transaction: updatedTx });

    } catch (error: any) {
        console.error('Transaction update error:', error);
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

        // 2. Reverse Financial Effect & Delete within a transaction
        await prisma.$transaction(async (prismaTx) => {
            // Reverse Kasa Balance
            if (tx.type === 'Expense' || tx.type === 'Payment') {
                // These reduced balance, so add back
                await prismaTx.kasa.update({
                    where: { id: tx.kasaId },
                    data: { balance: { increment: tx.amount } }
                });
            } else if (tx.type === 'Sales' || tx.type === 'Collection') {
                // These increased balance, so reduce
                await prismaTx.kasa.update({
                    where: { id: tx.kasaId },
                    data: { balance: { decrement: tx.amount } }
                });
            }

            // Reverse Customer Balance
            if (tx.customerId) {
                if (tx.type === 'Collection') {
                    // Collection reduced debt, so delete increases debt
                    await prismaTx.customer.update({
                        where: { id: tx.customerId },
                        data: { balance: { increment: tx.amount } }
                    });
                } else if (tx.type === 'Sales' || tx.type === 'Payment') {
                    // Sales/Payment increased debt, so delete decreases debt
                    await prismaTx.customer.update({
                        where: { id: tx.customerId },
                        data: { balance: { decrement: tx.amount } }
                    });
                }
            }

            // 3. Delete Record
            await prismaTx.transaction.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
