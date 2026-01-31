import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { installmentId, kasaId, installmentLabel } = await request.json();

        if (!installmentId || !kasaId) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });

        const installment: any = await prisma.installment.findUnique({
            where: { id: installmentId },
            include: { paymentPlan: true }
        });

        if (!installment || installment.status === 'Paid') {
            return NextResponse.json({ error: 'Taksit bulunamadı veya zaten ödenmiş' }, { status: 400 });
        }

        const installmentAmount = Number(installment.amount);

        // Transactional Operation
        const result = await prisma.$transaction(async (tx: any) => {
            const direction = installment.paymentPlan.direction || 'OUT';
            const isCollection = direction === 'IN';

            // 1. Create Transaction (Collection or Payment)
            const transaction = await tx.transaction.create({
                data: {
                    type: isCollection ? 'Collection' : 'Payment',
                    amount: installmentAmount,
                    description: `${installment.paymentPlan.title} - Taksit ${installment.installmentNo}/${installment.paymentPlan.installmentCount} (${isCollection ? 'Tahsilat' : 'Ödeme'})`,
                    kasaId: kasaId,
                    date: new Date(),
                    branch: installment.paymentPlan.branch || 'Merkez',
                    customerId: installment.paymentPlan.customerId || null,
                    supplierId: installment.paymentPlan.supplierId || null
                }
            });

            // 2. Update Kasa Balance
            await tx.kasa.update({
                where: { id: kasaId },
                data: { balance: { [isCollection ? 'increment' : 'decrement']: installmentAmount } }
            });

            // 3. Update Customer / Supplier Balance
            if (isCollection && installment.paymentPlan.customerId) {
                // Collection -> Customer Debt Decreases
                await tx.customer.update({
                    where: { id: installment.paymentPlan.customerId },
                    data: { balance: { decrement: installmentAmount } }
                });
            } else if (!isCollection && installment.paymentPlan.supplierId) {
                // Payment -> Supplier Dept Decreases
                await tx.supplier.update({
                    where: { id: installment.paymentPlan.supplierId },
                    data: { balance: { increment: installmentAmount } }
                });
            }

            // 4. Mark Installment as Paid
            const updatedInstallment = await tx.installment.update({
                where: { id: installmentId },
                data: {
                    status: 'Paid',
                    paidAt: new Date(),
                    transactionId: transaction.id
                }
            });

            // 5. Check if Plan is Completed
            const pendingCount = await tx.installment.count({
                where: { paymentPlanId: installment.paymentPlanId, status: 'Pending' }
            });

            if (pendingCount === 0) {
                await tx.paymentPlan.update({
                    where: { id: installment.paymentPlanId },
                    data: { status: 'Completed' }
                });
            }

            // 6. Handle POS Commission (New logic)
            const selectedKasa = await tx.kasa.findUnique({ where: { id: kasaId } });

            if (selectedKasa && selectedKasa.type.match(/POS|Kredi|Banka/) && isCollection) {
                try {
                    const settingsRes = await tx.appSettings.findUnique({ where: { key: 'salesExpenses' } });
                    const salesExpenses = settingsRes?.value as any;

                    if (salesExpenses?.posCommissions) {
                        const instLabelRaw = installmentLabel;
                        const instCount = parseInt(instLabelRaw) || 1;
                        const instLabelFallback = instLabelRaw ? instLabelRaw : (instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim');

                        let commissionConfig;
                        if (instLabelRaw) {
                            commissionConfig = salesExpenses.posCommissions.find((c: any) => c.installment === instLabelRaw);
                        }

                        if (!commissionConfig) {
                            commissionConfig = salesExpenses.posCommissions.find((c: any) =>
                                c.installment === instLabelFallback || (instCount === 1 && c.installment === 'Tek Çekim')
                            );
                        }

                        if (commissionConfig && Number(commissionConfig.rate) > 0) {
                            const rate = Number(commissionConfig.rate);
                            const commissionAmount = (installmentAmount * rate) / 100;

                            // Create Expense Transaction
                            await tx.transaction.create({
                                data: {
                                    type: 'Expense',
                                    amount: commissionAmount,
                                    description: `Banka POS Komisyon Gideri (${commissionConfig.installment}) - Taksit Tahsilatı: ${installment.paymentPlan.title}`,
                                    kasaId: kasaId,
                                    date: new Date(),
                                    branch: installment.paymentPlan.branch || 'Merkez'
                                }
                            });

                            // Deduct from Kasa
                            await tx.kasa.update({
                                where: { id: kasaId },
                                data: { balance: { decrement: commissionAmount } }
                            });
                        }
                    }
                } catch (commErr) {
                    console.error('Commission Error (ignored):', commErr);
                }
            }

            return {
                ...updatedInstallment,
                amount: Number(updatedInstallment.amount)
            };
        });

        return NextResponse.json({ success: true, installment: result });

    } catch (e: any) {
        console.error("Payment Error:", e);
        return NextResponse.json({ error: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
