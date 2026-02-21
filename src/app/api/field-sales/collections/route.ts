
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { visitId, customerId, kasaId, amount, description, type } = body;

        if (!customerId || !kasaId || !amount) {
            return NextResponse.json({ error: 'Eksik veri: Müşteri, Kasa ve Tutar zorunludur.' }, { status: 400 });
        }

        // Resolve Company ID
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        // Atomic Transaction (Prisma $transaction)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction record
            const transaction = await (tx as any).transaction.create({
                data: {
                    companyId: company.id,
                    customerId,
                    kasaId,
                    visitId,
                    type: type || 'IN', // Default to money IN (Collection)
                    amount: Number(amount),
                    description: description || 'Saha Tahsilatı',
                    date: new Date()
                }
            });

            // 2. Update Customer Balance (Collection reduces customer balance/debt)
            await (tx as any).customer.update({
                where: { id: customerId },
                data: {
                    balance: {
                        decrement: Number(amount)
                    }
                }
            });

            // 3. Update Kasa Balance (Increases cash in)
            await (tx as any).kasa.update({
                where: { id: kasaId },
                data: {
                    balance: {
                        increment: Number(amount)
                    }
                }
            });

            return transaction;
        });

        return NextResponse.json({ success: true, transactionId: result.id });

    } catch (error: any) {
        console.error('Field collection error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
