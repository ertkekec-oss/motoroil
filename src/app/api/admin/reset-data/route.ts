import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { confirmation, options, currentUsername } = await request.json();

        if (confirmation !== 'ONAYLIYORUM') {
            return NextResponse.json({ success: false, error: 'Onay kodu hatalı. Lütfen "ONAYLIYORUM" yazın.' });
        }

        if (!options) {
            return NextResponse.json({ success: false, error: 'Lütfen en az bir seçenek belirleyin.' });
        }

        const resetAll = options.all === true;

        await prisma.$transaction(async (tx: any) => {
            // --- ALL ---
            if (resetAll) {
                // Dependency order (leaves to root)
                await tx.installment.deleteMany({});
                await tx.paymentPlan.deleteMany({});
                await tx.transaction.deleteMany({});
                await tx.check.deleteMany({});

                await tx.salesInvoice.deleteMany({});
                await tx.serviceRecord.deleteMany({});
                await tx.order.deleteMany({});
                await tx.suspendedSale.deleteMany({});
                await tx.purchaseInvoice.deleteMany({});

                await tx.stockTransfer.deleteMany({});
                await tx.inventoryAudit.deleteMany({});
                await tx.stock.deleteMany({});
                await tx.marketplaceProductMap.deleteMany({});
                await tx.product.deleteMany({});

                await tx.warranty.deleteMany({});
                await tx.coupon.deleteMany({});
                await tx.customerDocument.deleteMany({});
                await tx.customer.deleteMany({});
                await tx.customerCategory.deleteMany({});
                await tx.supplier.deleteMany({});

                await tx.payroll.deleteMany({});
                await tx.leaveRequest.deleteMany({});
                await tx.shift.deleteMany({});
                await tx.staffDocument.deleteMany({});

                if (currentUsername) {
                    await tx.staff.deleteMany({
                        where: { NOT: { username: currentUsername } }
                    });
                } else {
                    await tx.staff.deleteMany({});
                }

                await tx.branchDocument.deleteMany({});
                await tx.branch.deleteMany({});

                await tx.notification.deleteMany({});
                await tx.securityEvent.deleteMany({});
                await tx.auditLog.deleteMany({});

                await tx.kasa.updateMany({ data: { balance: 0 } });
            } else {
                // --- SELECTIVE RESET ---

                if (options.ecommerce) {
                    await tx.order.deleteMany({});
                }

                if (options.pos) {
                    await tx.salesInvoice.deleteMany({});
                    await tx.serviceRecord.deleteMany({});
                    await tx.suspendedSale.deleteMany({});
                    await tx.transaction.deleteMany({ where: { type: 'Sales' } });
                }

                if (options.inventory) {
                    await tx.stockTransfer.deleteMany({});
                    await tx.inventoryAudit.deleteMany({});
                    await tx.stock.deleteMany({});
                    await tx.marketplaceProductMap.deleteMany({});
                    await tx.product.deleteMany({});
                }

                if (options.customers) {
                    await tx.salesInvoice.deleteMany({});
                    await tx.serviceRecord.deleteMany({});
                    await tx.warranty.deleteMany({});
                    await tx.coupon.deleteMany({});
                    await tx.customerDocument.deleteMany({});
                    // Clear plans associated with customers
                    await tx.installment.deleteMany({ where: { paymentPlan: { customerId: { not: null } } } });
                    await tx.paymentPlan.deleteMany({ where: { customerId: { not: null } } });
                    await tx.customer.deleteMany({});
                    await tx.customerCategory.deleteMany({});
                    await tx.transaction.deleteMany({ where: { NOT: { customerId: null } } });
                }

                if (options.receivables) {
                    await tx.installment.deleteMany({ where: { paymentPlan: { direction: 'IN' } } });
                    await tx.paymentPlan.deleteMany({ where: { direction: 'IN' } });
                    await tx.transaction.deleteMany({ where: { type: 'Collection' } });
                    await tx.customer.updateMany({ data: { balance: 0 } });
                }

                if (options.payables) {
                    await tx.purchaseInvoice.deleteMany({});
                    await tx.installment.deleteMany({ where: { paymentPlan: { direction: 'OUT' } } });
                    await tx.paymentPlan.deleteMany({ where: { direction: 'OUT' } });
                    await tx.transaction.deleteMany({ where: { type: 'Payment', supplierId: { not: null } } });
                    await tx.supplier.deleteMany({});
                }

                if (options.checks) {
                    await tx.check.deleteMany({ where: { type: { contains: 'Çek' } } });
                }

                if (options.notes) {
                    await tx.check.deleteMany({ where: { type: { contains: 'Senet' } } });
                }

                if (options.staff) {
                    await tx.payroll.deleteMany({});
                    await tx.leaveRequest.deleteMany({});
                    await tx.shift.deleteMany({});
                    await tx.staffDocument.deleteMany({});
                    if (currentUsername) {
                        await tx.staff.deleteMany({ where: { NOT: { username: currentUsername } } });
                    } else {
                        await tx.staff.deleteMany({});
                    }
                }

                if (options.branches) {
                    await tx.branchDocument.deleteMany({});
                    await tx.branch.deleteMany({});
                }

                if (options.expenses) {
                    await tx.transaction.deleteMany({ where: { type: 'Expense' } });
                }
            }

            await tx.auditLog.create({
                data: {
                    action: 'RESET_DATA',
                    entity: 'SYSTEM',
                    details: resetAll ? 'Tam sistem sıfırlama yapıldı.' : `Seçili alanlar sıfırlandı: ${Object.keys(options).filter(k => options[k]).join(', ')}`,
                    userName: currentUsername || 'Admin'
                }
            });
        }, {
            timeout: 60000
        });

        return NextResponse.json({ success: true, message: 'Veriler başarıyla sıfırlandı.' });

    } catch (e: any) {
        console.error("Reset error details:", e);
        let errorMsg = e.message || 'Sistem hatası';
        if (e.code === 'P2003') {
            errorMsg = "Veri bağlılığı hatası (FK Constraint). Lütfen ilgili diğer modülleri de (Cariler, Satışlar vb.) birlikte seçerek deneyin.";
        }
        return NextResponse.json({ success: false, error: errorMsg });
    }
}
