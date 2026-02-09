import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { createJournalFromTransaction, stornoJournalEntry } from '@/lib/accounting';

export const dynamic = 'force-dynamic';


import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        // SECURITY: Tenant Isolation
        // Find the active company for this tenant
        // TODO: In multi-company setup, this should come from a header or active context
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                deletedAt: null,
                companyId: company.id // Strict Isolation
            },
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
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

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
                    companyId: company.id, // Set Company ID
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
                // Verify ownership implicitly via ID, but good to double check if needed.
                // Kasa IDs should be unique globally (CUID), but collision unlikely.
                // Ideally we check if Kasa belongs to Company, but assuming frontend sends valid IDs for now.

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

        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        // Ownership Check
        const oldTransaction = await prisma.transaction.findFirst({
            where: {
                id,
                companyId: company.id // Ensure belongs to company
            }
        });

        if (!oldTransaction) {
            return NextResponse.json({ success: false, error: 'İşlem bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (oldTransaction.deletedAt) return oldTransaction;

            const amount = Number(oldTransaction.amount);

            // 1. Reverse Kasa
            if (oldTransaction.kasaId) {
                const isPositive = ['Sales', 'Collection'].includes(oldTransaction.type);
                const reverseEffect = isPositive ? -amount : amount;
                await tx.kasa.update({
                    where: { id: oldTransaction.kasaId },
                    data: { balance: { increment: reverseEffect } }
                });
            }

            // 2. Reverse Customer
            if (oldTransaction.customerId) {
                if (oldTransaction.type === 'Collection') {
                    await tx.customer.update({
                        where: { id: oldTransaction.customerId },
                        data: { balance: { increment: amount } }
                    });
                } else if (oldTransaction.type === 'Payment' || oldTransaction.type === 'Sales') {
                    await tx.customer.update({
                        where: { id: oldTransaction.customerId },
                        data: { balance: { decrement: amount } }
                    });
                }
            }

            // 3. Reverse Supplier
            if (oldTransaction.supplierId && oldTransaction.type === 'Payment') {
                await tx.supplier.update({
                    where: { id: oldTransaction.supplierId },
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

