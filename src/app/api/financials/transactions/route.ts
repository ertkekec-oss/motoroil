import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { createJournalFromTransaction, stornoJournalEntry } from '@/lib/accounting';

export const dynamic = 'force-dynamic';


import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const transactions = await prisma.transaction.findMany({
            where: { deletedAt: null },
            orderBy: {
                date: 'desc'
            },
            take: limit
        });
        return NextResponse.json({ success: true, transactions });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}



import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    // Check permission - using auth.user which is the session
    if (!hasPermission(session, 'transaction_manage')) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    try {
        const body = await request.json();
        let {
            type, amount, description, kasaId, customerId, supplierId, targetKasaId, branch, isAccountTransaction
        } = body;

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
                    targetKasaId: targetKasaId ? String(targetKasaId) : null,
                    customerId: customerId ? String(customerId) : null,
                    supplierId: supplierId ? String(supplierId) : null,
                    branch: branch || 'Merkez'
                }
            });

            // Update Kasa Balance
            if (!isAccountTransaction && kasaId && type !== 'Transfer') {
                const isPositive = ['Sales', 'Collection'].includes(type);
                const effect = isPositive ? amount : -amount;
                await tx.kasa.update({
                    where: { id: String(kasaId) },
                    data: { balance: { increment: effect } }
                });
            }

            // Customer Balance Logic
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

            if (!isAccountTransaction && supplierId && type === 'Payment') {
                await tx.supplier.update({
                    where: { id: String(supplierId) },
                    data: { balance: { increment: amount } }
                });
            }

            if (type === 'Transfer' && targetKasaId && kasaId) {
                await tx.kasa.update({ where: { id: String(kasaId) }, data: { balance: { decrement: amount } } });
                await tx.kasa.update({ where: { id: String(targetKasaId) }, data: { balance: { increment: amount } } });
            }

            return transaction;
        });

        const response = NextResponse.json({ success: true, transaction: result });

        // Background Tasks: Journal & Audit Log
        if (result) {
            (async () => {
                try {
                    if (!isAccountTransaction) {
                        await createJournalFromTransaction(result);
                    }

                    // AUDIT LOG
                    await logActivity({
                        userId: session.id,
                        userName: session.username,
                        action: 'CREATE',
                        entity: 'Transaction',
                        entityId: result.id,
                        newData: result,
                        branch: result.branch || 'Merkez',
                        details: `${result.type} işlemi: ${result.amount}`
                    });
                } catch (err) {
                    console.error('[Background Task Error]:', err);
                }
            })();
        }

        return response;
    } catch (error: any) {
        console.error('Transaction API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    if (!hasPermission(session, 'delete_records')) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Pre-fetch for audit log
        const oldTransaction = await prisma.transaction.findUnique({ where: { id } });

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({ where: { id } });
            if (!transaction) throw new Error('İşlem bulunamadı');
            if (transaction.deletedAt) return transaction;

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

            // 4. Storno Journal
            try {
                const journal = await tx.journal.findFirst({
                    where: { sourceId: id, sourceType: { in: ['Transaction', 'Order'] } }
                });
                if (journal) {
                    await stornoJournalEntry(journal.id, 'Finansal İşlem Silindi');
                }
            } catch (err) { console.error(err); }

            // 5. Mark Deleted
            return await tx.transaction.update({
                where: { id },
                data: { deletedAt: new Date() }
            });
        });

        // Audit Log
        if (oldTransaction) {
            logActivity({
                userId: session.id,
                userName: session.username,
                action: 'DELETE',
                entity: 'Transaction',
                entityId: id,
                oldData: oldTransaction,
                branch: oldTransaction.branch || 'Merkez',
                details: `İşlem silindi: ${oldTransaction.description} - ${oldTransaction.amount}`
            }).catch(console.error);
        }

        return NextResponse.json({ success: true, transaction: result });
    } catch (error: any) {
        console.error('Transaction Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

