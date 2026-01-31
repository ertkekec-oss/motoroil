import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const transactions = await prisma.transaction.findMany({
            where: { deletedAt: null },
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
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'transaction_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

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

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    type,
                    amount,
                    description,
                    kasaId: kasaId ? String(kasaId) : null,
                    customerId: customerId ? String(customerId) : null,
                    supplierId: supplierId ? String(supplierId) : null,
                    branch: branch || 'Merkez'
                }
            });

            if (!isAccountTransaction && kasaId) {
                const isPositive = ['Sales', 'Collection'].includes(type);
                const effect = isPositive ? amount : -amount;
                await tx.kasa.update({
                    where: { id: String(kasaId) },
                    data: { balance: { increment: effect } }
                });
            }

            if (customerId) {
                if (type === 'Collection') {
                    await tx.customer.update({
                        where: { id: String(customerId) },
                        data: { balance: { decrement: amount } }
                    });
                } else if (type === 'Payment' || type === 'Sales') {
                    await tx.customer.update({
                        where: { id: String(customerId) },
                        data: { balance: { increment: amount } }
                    });
                }
            }

            if (supplierId && type === 'Payment') {
                await tx.supplier.update({
                    where: { id: String(supplierId) },
                    data: { balance: { increment: amount } }
                });
            }

            if (type === 'Transfer' && targetKasaId && kasaId) {
                // Out from source kasa
                await tx.kasa.update({
                    where: { id: String(kasaId) },
                    data: { balance: { decrement: amount } }
                });
                // In to target kasa
                await tx.kasa.update({
                    where: { id: String(targetKasaId) },
                    data: { balance: { increment: amount } }
                });
            }

            return transaction;
        });

        return NextResponse.json({ success: true, transaction: result });
    } catch (error: any) {
        console.error('Transaction API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({ where: { id } });
            if (!transaction) throw new Error('İşlem bulunamadı');
            if (transaction.deletedAt) return transaction;

            // REVERSAL LOGIC
            const amount = Number(transaction.amount);

            // 1. Reverse Kasa
            if (transaction.kasaId) {
                const isPositive = ['Sales', 'Collection'].includes(transaction.type);
                const reverseEffect = isPositive ? -amount : amount;
                await tx.kasa.update({
                    where: { id: transaction.kasaId },
                    data: { balance: { increment: reverseEffect } }
                });
            }

            // 2. Reverse Customer
            if (transaction.customerId) {
                if (transaction.type === 'Collection') {
                    await tx.customer.update({
                        where: { id: transaction.customerId },
                        data: { balance: { increment: amount } }
                    });
                } else if (transaction.type === 'Payment' || transaction.type === 'Sales') {
                    await tx.customer.update({
                        where: { id: transaction.customerId },
                        data: { balance: { decrement: amount } }
                    });
                }
            }

            // 3. Reverse Supplier
            if (transaction.supplierId && transaction.type === 'Payment') {
                await tx.supplier.update({
                    where: { id: transaction.supplierId },
                    data: { balance: { decrement: amount } }
                });
            }

            // 4. Mark as Deleted
            return await tx.transaction.update({
                where: { id },
                data: { deletedAt: new Date() }
            });
        });

        return NextResponse.json({ success: true, transaction: result });
    } catch (error: any) {
        console.error('Transaction Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
