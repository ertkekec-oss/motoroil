import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        let companyId = session.impersonateTenantId ? null : (session as any).companyId;
        if (!companyId) {
            const targetTenantId = session.impersonateTenantId || session.tenantId;
            const company = await prisma.company.findFirst({
                where: { tenantId: targetTenantId }
            });
            companyId = company?.id;
        }

        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await request.json();
        const { type, data, config } = body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ success: false, error: 'Aktarılacak veri bulunamadı.' }, { status: 400 });
        }

        let importCount = 0;
        let errors = [];

        // START TRANSACTION FOR FULL ROLLBACK ON CRITICAL ERRORS
        await prisma.$transaction(async (tx) => {
            if (type === 'CUSTOMERS') {
                for (const row of data) {
                    try {
                        const balance = isNaN(parseFloat(row.balance)) ? 0 : parseFloat(row.balance);
                        const customer = await tx.customer.create({
                            data: {
                                companyId,
                                name: row.name || 'İsimsiz Cari',
                                email: row.email || null,
                                phone: row.phone || null,
                                taxNumber: row.taxNumber || null,
                                taxOffice: row.taxOffice || null,
                                address: row.address || null,
                                city: row.city || null,
                                district: row.district || null,
                                balance: balance,
                                categoryId: config?.categoryId || null
                            }
                        });

                        // Post Initial Balance Transaction if needed
                        if (balance !== 0) {
                            await tx.transaction.create({
                                data: {
                                    companyId,
                                    customerId: customer.id,
                                    type: balance > 0 ? 'Devir (Alacak)' : 'Devir (Verecek)',
                                    amount: Math.abs(balance),
                                    description: 'Sistem Açılış Bakiyesi (İçe Aktarım)',
                                    date: new Date()
                                }
                            });
                        }
                        importCount++;
                    } catch (e: any) {
                        errors.push(`Hata satırı (${row.name}): ${e.message}`);
                    }
                }
            } else if (type === 'SUPPLIERS') {
                for (const row of data) {
                    try {
                        const balance = isNaN(parseFloat(row.balance)) ? 0 : parseFloat(row.balance);
                        const supplier = await tx.supplier.create({
                            data: {
                                companyId,
                                name: row.name || 'İsimsiz Tedarikçi',
                                email: row.email || null,
                                phone: row.phone || null,
                                taxNumber: row.taxNumber || null,
                                taxOffice: row.taxOffice || null,
                                address: row.address || null,
                                city: row.city || null,
                                district: row.district || null,
                                balance: balance
                            }
                        });

                        if (balance !== 0) {
                            await tx.transaction.create({
                                data: {
                                    companyId,
                                    supplierId: supplier.id,
                                    type: balance > 0 ? 'Devir (Alacak)' : 'Devir (Verecek)',
                                    amount: Math.abs(balance),
                                    description: 'Sistem Açılış Bakiyesi (İçe Aktarım)',
                                    date: new Date()
                                }
                            });
                        }
                        importCount++;
                    } catch (e: any) {
                        errors.push(`Hata satırı (${row.name}): ${e.message}`);
                    }
                }
            } else if (type === 'PRODUCTS') {
                // Determine if we need to create a new PriceList
                let priceListId = null;
                if (config?.createPriceList && config?.priceListName) {
                    const priceList = await tx.priceList.create({
                        data: {
                            companyId,
                            name: config.priceListName,
                            description: 'İçe aktarım sırasında oluşturuldu.'
                        }
                    });
                    priceListId = priceList.id;
                }

                for (const row of data) {
                    try {
                        const price = isNaN(parseFloat(row.price)) ? 0 : parseFloat(row.price);
                        const buyPrice = isNaN(parseFloat(row.buyPrice)) ? 0 : parseFloat(row.buyPrice);
                        const stock = isNaN(parseInt(row.stock)) ? 0 : parseInt(row.stock);

                        // Fallback logic for code inside transaction scope
                        let code = row.code;
                        if (!code) {
                            code = `PRD${Math.floor(Math.random() * 1000000)}`;
                        }

                        const product = await tx.product.create({
                            data: {
                                companyId,
                                name: row.name || 'İsimsiz Ürün',
                                code: code,
                                barcode: row.barcode || null,
                                category: row.category || null,
                                brand: row.brand || null,
                                description: row.description || null,
                                price: price,
                                buyPrice: buyPrice,
                                stock: stock,
                                minStock: 5,
                                unit: row.unit || 'Adet'
                            }
                        });

                        if (stock > 0) {
                            await tx.stock.create({
                                data: {
                                    productId: product.id,
                                    branch: config?.branch || 'Merkez',
                                    quantity: stock
                                }
                            });

                            await tx.stockMovement.create({
                                data: {
                                    companyId,
                                    productId: product.id,
                                    branch: config?.branch || 'Merkez',
                                    quantity: stock,
                                    price: buyPrice > 0 ? buyPrice : price,
                                    type: 'Giriş (Sayım/Devir)',
                                    referenceId: 'IMPORT'
                                }
                            });
                        }

                        if (priceListId && row.priceListValue) {
                            const customPrice = isNaN(parseFloat(row.priceListValue)) ? price : parseFloat(row.priceListValue);
                            await tx.productPrice.create({
                                data: {
                                    companyId,
                                    productId: product.id,
                                    priceListId: priceListId,
                                    price: customPrice,
                                    isManualOverride: true
                                }
                            });
                        }
                        importCount++;
                    } catch (e: any) {
                        errors.push(`Hata satırı (${row.name}): ${e.message}`);
                    }
                }
            } else {
                throw new Error("Geçersiz aktarım tipi.");
            }
        });

        return NextResponse.json({
            success: true,
            message: `${importCount} kayıt başarıyla aktarıldı.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('❌ İçe aktarım hatası:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Kayıtlar aktarılırken iptal edildi.'
        }, { status: 500 });
    }
}
