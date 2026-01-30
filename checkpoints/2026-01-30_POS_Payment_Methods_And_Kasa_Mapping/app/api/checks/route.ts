
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const checks = await prisma.check.findMany({
            orderBy: { dueDate: 'asc' },
            include: {
                customer: true,
                supplier: true
            }
        });
        return NextResponse.json({ success: true, checks });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, number, bank, dueDate, amount, description, customerId, supplierId } = body;

        const amountVal = parseFloat(amount);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get or Create Checks Kasa
            let checksKasa = await tx.kasa.findFirst({
                where: { name: 'ÇEK / SENET PORTFÖYÜ' }
            });

            if (!checksKasa) {
                checksKasa = await tx.kasa.create({
                    data: {
                        name: 'ÇEK / SENET PORTFÖYÜ',
                        type: 'Evrak',
                        balance: 0
                    }
                });
            }

            // 2. Create the Check record
            const check = await tx.check.create({
                data: {
                    type,
                    number,
                    bank,
                    dueDate: new Date(dueDate),
                    amount: amountVal,
                    description,
                    customerId,
                    supplierId
                }
            });

            // 3. Determine Transaction Type
            // Alınan -> Tahsilat (Balance'ı azaltır), Verilen -> Ödeme (Balance'ı artırır)
            let transType = type.includes('Verilen') ? 'Payment' : 'Collection';

            // 4. Create Financial Transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: transType,
                    amount: amountVal,
                    description: `${type}: ${number} - ${bank || ''} (Vade: ${dueDate}) ${description || ''}`,
                    kasaId: checksKasa.id,
                    customerId,
                    supplierId
                }
            });

            // 5. Update Checks Kasa Balance
            // Alınan (+), Verilen (-)
            const kasaEffect = type.includes('Alınan') ? amountVal : -amountVal;
            await tx.kasa.update({
                where: { id: checksKasa.id },
                data: { balance: { increment: kasaEffect } }
            });

            // 6. Update Customer Balance
            if (customerId) {
                if (type.includes('Alınan')) {
                    // Tahsilat decreases debt (decrement balance)
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { decrement: amountVal } }
                    });
                } else {
                    // Verilen increases debt or credit (increment balance)
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { increment: amountVal } }
                    });
                }
            }

            // 7. Update Supplier Balance
            if (supplierId) {
                if (type.includes('Verilen')) {
                    // Ödeme increases balance (we owe less)
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: { balance: { increment: amountVal } }
                    });
                } else {
                    // Alınan (Refund/Exchange) decreases balance
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: { balance: { decrement: amountVal } }
                    });
                }
            }

            return check;
        });

        return NextResponse.json({ success: true, check: result });
    } catch (error: any) {
        console.error('Check POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
