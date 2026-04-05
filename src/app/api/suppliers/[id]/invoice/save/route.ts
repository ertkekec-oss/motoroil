import { NextResponse, NextRequest } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: supplierId } = await params;
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await req.json();
        const { 
            invoiceNo, invoiceDate, items, totalAmount, 
            type, isExpense, customDueDate, notes, matchedWaybillId 
        } = body;

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.companyId !== company.id) {
            return NextResponse.json({ success: false, error: 'Yetkisiz işlem veya tedarikçi bulunamadı.' }, { status: 403 });
        }

        // 1. Process items (Only if it's NOT an Expense and NOT matched with a previous waybill which already added stock)
        const processedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            let product = await prisma.product.findFirst({
                where: { companyId: company.id, OR: [{ code: item.code }, { name: item.name }] }
            });

            if (!product) {
                // If product doesn't exist, we must create it even if expense, just so we have a reference, 
                // OR we skip creating if it's an expense? Usually we create a generic service item.
                product = await prisma.product.create({
                    data: {
                        name: item.name,
                        code: item.code || `PRD-${Math.floor(Math.random() * 100000)}`,
                        companyId: company.id,
                        price: item.price * 1.2,
                        buyPrice: item.price,
                        stock: (!isExpense && !matchedWaybillId) ? item.qty : 0, // ONLY ADD STOCK IF REAL INBOUND
                        category: isExpense ? 'Gider/Masraf' : 'Otomatik',
                        type: isExpense ? 'Hizmet' : 'Diğer',
                        supplierName: supplier.name
                    }
                });

                // If added stock during creation, create a stock movement log
                if (!isExpense && !matchedWaybillId && item.qty > 0) {
                    await prisma.stockMovement.create({
                        data: {
                            productId: product.id,
                            companyId: company.id,
                            type: 'IN',
                            quantity: item.qty,
                            description: `Fatura ile Sisteme Giriş (${invoiceNo})`,
                            referenceId: invoiceNo,
                            branch: (session as any).branch || ' Merkez'
                        }
                    });
                }
            } else {
                // Product exists. Update stock and price only if real inbound stock
                if (!isExpense && !matchedWaybillId) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            stock: { increment: item.qty },
                            buyPrice: item.price
                        }
                    });

                    // Add Stock Movement Log
                    await prisma.stockMovement.create({
                        data: {
                            productId: product.id,
                            companyId: company.id,
                            type: 'IN',
                            quantity: item.qty,
                            description: `Fatura Mal Alım Girişi (${invoiceNo})`,
                            referenceId: invoiceNo,
                            branch: (session as any).branch || ' Merkez'
                        }
                    });
                }
            }

            processedItems.push({
                productId: product.id,
                name: product.name,
                code: product.code,
                qty: item.qty,
                price: item.price,
                total: item.qty * item.price
            });

            calculatedTotal += (item.qty * item.price);
        }

        const finalTotalAmount = totalAmount > 0 ? totalAmount : calculatedTotal;
        
        // Return invoices add balance to supplier (they owe us), Normal invoices deduct (we owe them)
        const isReturn = type === 'RETURN';
        let newBalance = Number(supplier.balance);
        if (isReturn) {
            newBalance += finalTotalAmount;
        } else {
            newBalance -= finalTotalAmount;
        }

        // 2. Determine Due Date for Global Calendar
        const dueDate = customDueDate ? new Date(customDueDate) : (invoiceDate ? new Date(invoiceDate) : new Date());

        // 3. If matched waybill, we would ideally mark it invoiced. (Simulation for now)
        // if (matchedWaybillId) await prisma.deliveryNote.update({ where: { id: matchedWaybillId }, data: { status: 'INVOICED' }});

        // 4. Record transactions
        await prisma.$transaction([
            prisma.purchaseInvoice.create({
                data: {
                    companyId: company.id,
                    supplierId,
                    invoiceNo: invoiceNo || `INV-${Date.now()}`,
                    invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                    dueDate: dueDate,
                    amount: finalTotalAmount,
                    taxAmount: 0,
                    totalAmount: finalTotalAmount,
                    description: isExpense ? `[GİDER/MASRAF] ${notes || 'Fatura Yüklemesi'}` : (notes || 'Otomatik Fatura Yüklemesi'),
                    status: 'Onaylandı',
                    items: processedItems
                }
            }),
            prisma.transaction.create({
                data: {
                    companyId: company.id,
                    type: isReturn ? 'Refund' : 'Purchase',
                    amount: finalTotalAmount,
                    description: `${isExpense ? 'Masraf ' : ''}${isReturn ? 'İade ' : ''}Faturası (${invoiceNo}) ${matchedWaybillId ? '- İrsaliye Eşleşmeli' : ''}`,
                    supplierId: supplierId,
                    branch: (session as any).branch || 'Merkez'
                }
            }),
            prisma.supplier.update({
                where: { id: supplierId },
                data: { balance: newBalance }
            })
        ]);

        return NextResponse.json({ success: true, balance: newBalance });

    } catch (error: any) {
        console.error("Save Parsed Invoice ERror:", error);
        return NextResponse.json({ success: false, error: 'Sistem hatası: ' + error.message }, { status: 500 });
    }
}
