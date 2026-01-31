
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                date: 'desc'
            }
        });
        return NextResponse.json({ success: true, transactions });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let {
            type,
            amount,
            description,
            kasaId,
            customerId,
            supplierId,
            targetKasaId,
            branch,
            isAccountTransaction
        } = body;

        // Validation & Parsing
        amount = parseFloat(amount);
        if (isNaN(amount)) {
            return NextResponse.json({ success: false, error: 'Invalid Amount' }, { status: 400 });
        }

        // Ensure IDs are strings (schema uses CUIDs)
        kasaId = String(kasaId);
        if (customerId) customerId = String(customerId);
        if (supplierId) supplierId = String(supplierId);
        if (targetKasaId) targetKasaId = String(targetKasaId);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction record
            const transaction = await tx.transaction.create({
                data: {
                    type,
                    amount,
                    description,
                    kasaId,
                    customerId,
                    supplierId,
                    branch: branch || 'Merkez'
                }
            });

            // 2. Update Kasa Balance
            // Effect depends on type:
            // Collection/Sales: +
            // Payment/Expense/Purchase: -
            if (!isAccountTransaction) {
                const isPositive = ['Sales', 'Collection'].includes(type);
                const effect = isPositive ? amount : -amount;

                await tx.kasa.update({
                    where: { id: kasaId },
                    data: { balance: { increment: effect } }
                });
            }

            // 3. Update Customer Balance (if applicable)
            if (customerId) {
                // Customer balance: positive means they owe us (debt), negative means they paid extra (credit).
                // Sale (SalesInvoice) increases balance (they owe more) - Handled in sales API usually.
                // Collection (Tahsilat) decreases balance (they owe less).
                if (type === 'Collection') {
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { decrement: amount } }
                    });
                } else if (type === 'Payment' || type === 'Sales') {
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { increment: amount } }
                    });
                }
            }

            // 4. Update Supplier Balance (if applicable)
            if (supplierId) {
                // Supplier balance: negative means we owe them (debt), positive means we have credit.
                // Payment (Ödeme) increases balance (we owe less).
                if (type === 'Payment') {
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: { balance: { increment: amount } }
                    });
                }
            }

            // 5. Handle Virman (Transfer)
            if (type === 'Transfer' && targetKasaId) {
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { increment: amount } }
                });

                // Also create the receiving side transaction? 
                // Usually one transaction record is enough with "From X to Y" description
            }

            return transaction;
        });

        return NextResponse.json({ success: true, transaction: result });

    } catch (error: any) {
        console.error('Transaction API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
