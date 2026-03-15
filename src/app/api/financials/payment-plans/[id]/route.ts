import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    const { id } = await params;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const plan = await prisma.paymentPlan.findUnique({
            where: { id, companyId: company.id }
        });

        if (!plan) {
            return NextResponse.json({ success: false, error: 'Plan bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }
        
        if (plan.status === 'İptal') {
            return NextResponse.json({ success: false, error: 'Plan zaten iptal edilmiş.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Cancel plan
            await tx.paymentPlan.update({
                where: { id },
                data: { status: 'İptal' }
            });

            // Cancel associated pending installments
            await tx.installment.updateMany({
                where: { paymentPlanId: id, status: 'Pending' },
                data: { status: 'Cancelled' }
            });

            // ================= REVERT FINANCIAL EFFECTS =================

            // 1. If it created a Sales or Purchase transaction for a non-existing debt
            // Usually PaymentPlan creates a transaction with description `Vadeli Satış Planı: ${title}`
            if (plan.direction === 'IN' && plan.customerId) {
                const salesTx = await tx.transaction.findFirst({
                    where: { customerId: plan.customerId, description: `Vadeli Satış Planı: ${plan.title}`, type: 'Sales', deletedAt: null }
                });
                if (salesTx) {
                    await tx.customer.update({
                        where: { id: plan.customerId },
                        data: { balance: { decrement: salesTx.amount } }
                    });
                    await tx.transaction.update({
                        where: { id: salesTx.id },
                        data: { deletedAt: new Date() }
                    });
                }

                // 2. Revert checks/senet if they were given
                if (plan.type === 'Çek' || plan.type === 'Senet') {
                    // Check if a transaction for receiving checks exists
                    const checkTx = await tx.transaction.findFirst({
                        where: { customerId: plan.customerId, description: { contains: `${plan.type} Alındı - ${plan.title}` }, deletedAt: null }
                    });

                    if (checkTx) {
                        // Revert the decrement that happened when we received the checks
                        await tx.customer.update({
                            where: { id: plan.customerId },
                            data: { balance: { increment: checkTx.amount } }
                        });
                        await tx.transaction.update({
                            where: { id: checkTx.id },
                            data: { deletedAt: new Date() }
                        });
                    }

                    // Delete the pending/portfolio checks created by this plan
                    await tx.check.deleteMany({
                         where: { 
                             customerId: plan.customerId, 
                             description: { startsWith: plan.title }, 
                             status: { in: ['Beklemede', 'Portföyde'] } 
                         }
                    });
                }
            } else if (plan.direction === 'OUT' && plan.supplierId) {
                const purchaseTx = await tx.transaction.findFirst({
                    where: { supplierId: plan.supplierId, description: `Vadeli Borç Planı: ${plan.title}`, type: 'Purchase', deletedAt: null }
                });
                if (purchaseTx) {
                    await tx.supplier.update({
                        where: { id: plan.supplierId },
                        data: { balance: { increment: purchaseTx.amount } }
                    });
                    await tx.transaction.update({
                        where: { id: purchaseTx.id },
                        data: { deletedAt: new Date() }
                    });
                }

                if (plan.type === 'Çek' || plan.type === 'Senet') {
                    const checkTx = await tx.transaction.findFirst({
                        where: { supplierId: plan.supplierId, description: { contains: `${plan.type} Verildi - ${plan.title}` }, deletedAt: null }
                    });

                    if (checkTx) {
                        await tx.supplier.update({
                            where: { id: plan.supplierId },
                            data: { balance: { decrement: checkTx.amount } }
                        });
                        await tx.transaction.update({
                            where: { id: checkTx.id },
                            data: { deletedAt: new Date() }
                        });
                    }

                    await tx.check.deleteMany({
                         where: { 
                             supplierId: plan.supplierId, 
                             description: { startsWith: plan.title }, 
                             status: { in: ['Beklemede', 'Portföyde'] } 
                         }
                    });
                }
            }
        });

        return NextResponse.json({ success: true, message: 'Plan iptal edildi.' });
    } catch (error: any) {
        console.error('Payment Plan Cancel Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
