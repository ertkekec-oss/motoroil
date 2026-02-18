
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccountingSlip, createJournalFromTransaction } from '@/lib/accounting';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const { installmentId, kasaId, installmentLabel } = await request.json();

        if (!installmentId || !kasaId) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });

        // SECURITY: Verify Kasa Ownership
        const validKasa = await prisma.kasa.findFirst({
            where: { id: kasaId, companyId: company.id }
        });

        if (!validKasa) {
            return NextResponse.json({ error: 'Geçersiz Kasa/Banka seçimi.' }, { status: 400 });
        }

        const installment: any = await prisma.installment.findUnique({
            where: { id: installmentId },
            include: { paymentPlan: true }
        });

        if (!installment || installment.status === 'Paid') {
            return NextResponse.json({ error: 'Taksit bulunamadı veya zaten ödenmiş' }, { status: 400 });
        }

        // SECURITY: Verify Payment Plan Ownership
        if (installment.paymentPlan.companyId !== company.id) {
            return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
        }

        const installmentAmount = Number(installment.amount);

        // Transactional Operation
        const result = await prisma.$transaction(async (tx: any) => {
            const direction = installment.paymentPlan.direction || 'OUT';
            const isCollection = direction === 'IN';

            // 1. Create Transaction (Collection or Payment)
            const transaction = await tx.transaction.create({
                data: {
                    companyId: company.id, // Set Company ID
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
            // validKasa is already verified and fetched above, but it's outside the tx scope if we want to be pure.
            // However, verify logic passed. We can use `validKasa` details or re-fetch if we needed locking semantics (but update above handles lock implicitly on row).
            // Actually, `tx` should be used for consistency if we wanted to lock, but `validKasa` was just a check.

            if (validKasa.type.match(/POS|Kredi|Banka/) && isCollection) {
                try {
                    const settingsRes = await tx.appSettings.findUnique({
                        where: {
                            companyId_key: {
                                companyId: company.id,
                                key: 'salesExpenses'
                            }
                        }
                    });
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
                            const commTrx = await tx.transaction.create({
                                data: {
                                    companyId: company.id, // Set Company ID
                                    type: 'Expense',
                                    amount: commissionAmount,
                                    description: `Banka POS Komisyon Gideri (${commissionConfig.installment}) - Taksit Tahsilatı: ${installment.paymentPlan.title}`,
                                    kasaId: kasaId,
                                    date: new Date(),
                                    branch: installment.paymentPlan.branch || 'Merkez'
                                }
                            });

                            // Auto-Generate Journal Entry for commission
                            await createJournalFromTransaction(commTrx, tx); // Pass tx

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
