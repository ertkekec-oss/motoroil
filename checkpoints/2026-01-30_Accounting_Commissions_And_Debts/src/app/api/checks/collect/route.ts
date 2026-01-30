
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { checkId, targetKasaId } = body;

        if (!checkId || !targetKasaId) {
            return NextResponse.json({ success: false, error: 'Check ID and Target Kasa ID are required.' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get the check
            const check = await tx.check.findUnique({
                where: { id: checkId }
            });

            if (!check) {
                throw new Error('Check not found.');
            }

            if (check.status !== 'Beklemede') {
                throw new Error('Only pending checks can be collected/paid.');
            }

            // 2. Get Portfolio Kasa
            const portfolioKasa = await tx.kasa.findFirst({
                where: { name: 'ÇEK / SENET PORTFÖYÜ' }
            });

            if (!portfolioKasa) {
                throw new Error('Portfolio account not found.');
            }

            const amountVal = Number(check.amount);
            const isAlinan = check.type.includes('Alınan');
            const newStatus = isAlinan ? 'Tahsil Edildi' : 'Ödendi';

            // 3. Update Check Status
            await tx.check.update({
                where: { id: checkId },
                data: { status: newStatus }
            });

            // 4. Move Money from Portfolio to Target Kasa
            // If Alınan: Portfolio balance decreases, Target balance increases
            // If Verilen: Portfolio balance increases (less debt in portfolio?), Target balance decreases

            // Re-thinking Verilen: 
            // When entered, Verilen decreases portfolio (as it's a debt record?)
            // Wait, Verilen Çek entry logic:
            // kasaEffect = type.includes('Alınan') ? amountVal : -amountVal;
            // So Verilen Çek makes portfolio balance NEGATIVE (debt).
            // When we "PAY" it:
            // Portfolio should increase (back to 0), and Target kasa should decrease (actual cash out).

            if (isAlinan) {
                // Portfolio - , Target +
                await tx.kasa.update({
                    where: { id: portfolioKasa.id },
                    data: { balance: { decrement: amountVal } }
                });
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { increment: amountVal } }
                });
            } else {
                // Portfolio + , Target -
                await tx.kasa.update({
                    where: { id: portfolioKasa.id },
                    data: { balance: { increment: amountVal } }
                });
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { decrement: amountVal } }
                });
            }

            // 5. Create Transaction Record
            await tx.transaction.create({
                data: {
                    type: isAlinan ? 'Collection' : 'Payment',
                    amount: amountVal,
                    description: `${newStatus}: ${check.type} (${check.number}) -> Portföyden Kasa'ya Aktarım`,
                    kasaId: targetKasaId,
                    customerId: check.customerId,
                    supplierId: check.supplierId
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Check collection error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
