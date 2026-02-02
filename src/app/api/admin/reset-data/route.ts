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

                // 1. Messaging
                await tx.message.deleteMany({});

                // 2. Accounting
                await tx.journalItem.deleteMany({});
                await tx.journal.deleteMany({});
                await tx.account.deleteMany({});

                // 3. Inventory & Products
                await tx.stockMovement.deleteMany({});
                await tx.stockTransfer.deleteMany({});
                await tx.inventoryAudit.deleteMany({});
                await tx.stock.deleteMany({});
                await tx.marketplaceProductMap.deleteMany({});
                await tx.product.deleteMany({});

                // 4. Financials
                await tx.installment.deleteMany({});
                await tx.paymentPlan.deleteMany({});
                await tx.transaction.deleteMany({});
                await tx.check.deleteMany({});

                // 5. Sales & Purchases
                await tx.salesInvoice.deleteMany({});
                await tx.serviceRecord.deleteMany({});
                await tx.quote.deleteMany({});
                await tx.order.deleteMany({});
                await tx.suspendedSale.deleteMany({});
                await tx.purchaseInvoice.deleteMany({});

                // 6. CRM (Customers & Suppliers)
                await tx.warranty.deleteMany({});
                await tx.coupon.deleteMany({});
                await tx.customerDocument.deleteMany({});
                await tx.customer.deleteMany({});
                await tx.customerCategory.deleteMany({});
                await tx.supplier.deleteMany({});

                // 7. Staff & HR
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

                // 8. System Entities
                await tx.branchDocument.deleteMany({});
                await tx.branch.deleteMany({ where: { NOT: { name: 'Merkez' } } });

                await tx.notification.deleteMany({});
                await tx.securityEvent.deleteMany({});
                await tx.auditLog.deleteMany({}); // Delete audit logs (except this one being created)

                await tx.kasa.deleteMany({});

                // Clean up AppSettings if fully resetting? (Usually settings are kept unless asked)
                // await tx.appSettings.deleteMany({});
            } else {
                // --- SELECTIVE RESET ---

                if (options.ecommerce) {
                    await tx.order.deleteMany({});
                }

                if (options.pos) {
                    // POS requires deleting linked child records first
                    await tx.salesInvoice.deleteMany({});
                    await tx.serviceRecord.deleteMany({});
                    await tx.suspendedSale.deleteMany({});
                    await tx.quote.deleteMany({});
                    await tx.transaction.deleteMany({ where: { type: 'Sales' } });
                }

                if (options.inventory) {
                    await tx.stockTransfer.deleteMany({});
                    await tx.inventoryAudit.deleteMany({});
                    await tx.stockMovement.deleteMany({});
                    await tx.stock.deleteMany({});
                    await tx.marketplaceProductMap.deleteMany({});
                    // Note: products link to marketplaceProductMap, stocks, movements (all cascaded or deleted above)
                    await tx.product.deleteMany({});
                }

                if (options.customers) {
                    // 1. Delete all records linking to customers first
                    await tx.salesInvoice.deleteMany({});
                    await tx.serviceRecord.deleteMany({});
                    await tx.warranty.deleteMany({});
                    await tx.coupon.deleteMany({});
                    await tx.quote.deleteMany({});
                    await tx.customerDocument.deleteMany({});
                    await tx.check.deleteMany({ where: { customerId: { not: null } } });

                    // 2. Clear plans associated with customers
                    await tx.installment.deleteMany({ where: { paymentPlan: { customerId: { not: null } } } });
                    await tx.paymentPlan.deleteMany({ where: { customerId: { not: null } } });

                    // 3. Delete linked transactions
                    await tx.transaction.deleteMany({ where: { NOT: { customerId: null } } });

                    // 4. Finally delete customers
                    await tx.customer.deleteMany({});
                    await tx.customerCategory.deleteMany({});
                }

                if (options.receivables) {
                    await tx.installment.deleteMany({ where: { paymentPlan: { direction: 'IN' } } });
                    await tx.paymentPlan.deleteMany({ where: { direction: 'IN' } });
                    await tx.transaction.deleteMany({ where: { type: { in: ['Collection', 'Sales'] } } });
                    await tx.customer.updateMany({ data: { balance: 0 } });
                }


                if (options.payables) {
                    await tx.purchaseInvoice.deleteMany({});
                    await tx.check.deleteMany({ where: { supplierId: { not: null } } });
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
                    await tx.message.deleteMany({});
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
                    await tx.branch.deleteMany({ where: { NOT: { name: 'Merkez' } } });
                }

                if (options.expenses) {
                    await tx.transaction.deleteMany({ where: { type: 'Expense' } });
                }

                // Ensure Kasa & Accounting integrity
                // If any financial-impacting module is reset, we must ensure Kasa and Account balances are zeroed 
                // and journal entries are cleared to prevent "phantom" balances and data mismatch.
                if (options.pos || options.receivables || options.payables || options.expenses || options.checks || options.notes || options.ecommerce || options.customers) {

                    // 1. Reset Kasa balances to 0
                    await tx.kasa.updateMany({ data: { balance: 0 } });

                    // 2. Clear Accounting records (Journals and Journal Items)
                    await tx.journalItem.deleteMany({});
                    await tx.journal.deleteMany({});

                    // 3. Reset all Accounting Account balances to 0
                    await tx.account.updateMany({ data: { balance: 0 } });

                    // 4. Clear Transfer transactions
                    await tx.transaction.deleteMany({ where: { type: 'Transfer' } });
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
