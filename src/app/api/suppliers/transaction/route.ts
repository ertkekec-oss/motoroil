
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await request.json();
        const { supplierId, type, amount, description, invoiceNo, invoiceDate, items } = body;

        if (supplierId === undefined || amount === undefined || amount === null) {
            console.error('API Validation Failed:', { supplierId, amount });
            return NextResponse.json({ success: false, error: 'Tedarikçi ID ve Tutar (Miktar) alanı zorunludur.' }, { status: 400 });
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier) {
            return NextResponse.json({ success: false, error: 'Tedarikçi bulunamadı.' }, { status: 404 });
        }

        // SECURITY: Verify Supplier Ownership
        if (supplier.companyId !== company.id) {
            return NextResponse.json({ success: false, error: 'Yetkisiz işlem.' }, { status: 403 });
        }

        let newBalance = supplier.balance;

        if (type === 'PURCHASE') {
            // Purchase increases debt (decreases balance)
            newBalance = Number(newBalance) - parseFloat(amount); // Type safe math

            // Using prisma bits for better consistency
            const operations: any[] = [
                prisma.purchaseInvoice.create({
                    data: {
                        companyId: company.id, // Set Company ID
                        supplierId,
                        invoiceNo: invoiceNo || `M-${Date.now()}`,
                        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                        amount: parseFloat(amount),
                        totalAmount: parseFloat(amount),
                        description: description || 'Manuel Alış Girişi',
                        status: 'Bekliyor',
                        items: items || []
                    }
                }),
                prisma.supplier.update({
                    where: { id: supplierId },
                    data: { balance: newBalance }
                })
            ];

            // If we have items (products), update their stocks and buy prices
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        try {
                            // First check if product exists to avoid transaction failure
                            const product = await prisma.product.findUnique({
                                where: { id: item.productId.toString() }
                            });

                            if (product) {
                                operations.push(
                                    prisma.product.update({
                                        where: { id: item.productId.toString() },
                                        data: {
                                            stock: { increment: item.qty || 0 },
                                            buyPrice: item.price || undefined
                                        }
                                    })
                                );
                            } else {
                                console.warn(`Product not found for update: ${item.productId}. Skipping stock update for this item.`);
                            }
                        } catch (err) {
                            console.error(`Error checking product ${item.productId}:`, err);
                        }
                    }
                }
            }

            await prisma.$transaction(operations);

        } else if (type === 'ADJUSTMENT') {
            // Manual adjustment
            const numAmount = parseFloat(amount);
            newBalance = Number(newBalance) + numAmount;

            // Find a valid Kasa ID to satisfy relation (Tenant Scoped)
            const defaultKasa = await prisma.kasa.findFirst({
                where: {
                    isActive: true, // Prefer active
                    companyId: company.id // Strict Tenant Isolation
                }
            });

            if (!defaultKasa) {
                return NextResponse.json({ success: false, error: 'Sistemde kayıtlı kasa bulunamadı.' }, { status: 400 });
            }

            await prisma.$transaction([
                prisma.supplier.update({
                    where: { id: supplierId },
                    data: { balance: newBalance }
                }),
                prisma.transaction.create({
                    data: {
                        companyId: company.id, // Set Company ID
                        type: 'Adjustment',
                        amount: numAmount,
                        description: description || 'Manuel Bakiye Düzeltmesi',
                        kasaId: defaultKasa.id,
                        supplierId: supplierId
                    }
                })
            ]);
        } else {
            return NextResponse.json({ success: false, error: 'Geçersiz işlem tipi.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, balance: newBalance });
    } catch (error: any) {
        console.error('Supplier transaction error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
