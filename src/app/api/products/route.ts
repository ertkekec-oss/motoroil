import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        // Get company for this tenant
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        const whereClause: any = {
            deletedAt: null
        };

        if (companyId) {
            whereClause.companyId = companyId;
        } else if (tenantId) {
            const company = await prisma.company.findFirst({
                where: { tenantId }
            });
            if (company) {
                whereClause.companyId = company.id;
            }
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                stocks: true,
                prices: {
                    include: {
                        priceList: true
                    }
                }
            }
        });
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        // Get tenant's company
        const tenantId = (session as any).tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant bilgisi bulunamadı' }, { status: 400 });
        }

        const company = await prisma.company.findFirst({
            where: { tenantId }
        });

        if (!company) {
            return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
        }

        const body = await request.json();
        const { name, code, barcode, brand, category, type, stock, price, buyPrice, supplier, branch,
            salesVat, salesVatIncluded, purchaseVat, purchaseVatIncluded,
            salesOiv, salesOtv, otvType, isParent, variantsData, unit,
            currency, purchaseCurrency } = body;

        const targetBranch = branch || 'Merkez';
        const initialQty = parseFloat(stock) || 0;
        const bPrice = parseFloat(buyPrice) || 0;

        const product = await prisma.$transaction(async (tx) => {
            // 1. Create the Main Product (Parent)
            const mainProduct = await tx.product.create({
                data: {
                    companyId: company.id, // Add companyId for tenant isolation
                    name,
                    code: code || `SKU-${Date.now()}`,
                    barcode: barcode || '',
                    brand: brand || '',
                    category: category || 'Genel',
                    type: type || 'Ürün',
                    stock: isParent ? 0 : initialQty,
                    price: parseFloat(price) || 0,
                    currency: currency || 'TRY',
                    buyPrice: bPrice,
                    purchaseCurrency: purchaseCurrency || 'TRY',
                    supplierName: supplier || '', // Fix: supplier -> supplierName
                    branch: 'Merkez',
                    unit: unit || 'Adet',
                    salesVat: parseInt(salesVat) || 20,
                    salesVatIncluded: salesVatIncluded !== undefined ? salesVatIncluded : true,
                    purchaseVat: parseInt(purchaseVat) || 20,
                    purchaseVatIncluded: purchaseVatIncluded !== undefined ? purchaseVatIncluded : true,
                    salesOiv: parseFloat(salesOiv) || 0,
                    salesOtv: parseFloat(salesOtv) || 0,
                    otvType: otvType || 'Ö.T.V yok',
                    isParent: isParent || false,
                    stocks: !isParent ? {
                        create: {
                            branch: targetBranch,
                            quantity: initialQty
                        }
                    } : undefined
                },
                include: { stocks: true }
            });

            // 2. If it's a parent, create children (variants)
            if (isParent && variantsData && Array.isArray(variantsData)) {
                for (const v of variantsData) {
                    const childProduct = await tx.product.create({
                        data: {
                            companyId: company.id, // Add companyId for tenant isolation
                            name: `${name} (${v.variantLabel})`,
                            code: v.code || `${mainProduct.code}-${v.variantLabel.replace(/\s+/g, '-').toUpperCase()}`,
                            barcode: v.barcode || '',
                            brand: brand || '',
                            category: category || 'Genel',
                            type: 'Varyant',
                            stock: parseFloat(v.stock) || 0,
                            price: parseFloat(v.price) || mainProduct.price,
                            currency: currency || 'TRY',
                            buyPrice: parseFloat(v.buyPrice) || bPrice,
                            purchaseCurrency: purchaseCurrency || 'TRY',
                            supplierName: supplier || '', // Fix: supplier -> supplierName
                            branch: 'Merkez',
                            parentId: mainProduct.id,
                            unit: unit || 'Adet',
                            salesVat: mainProduct.salesVat,
                            purchaseVat: mainProduct.purchaseVat,
                            stocks: {
                                create: {
                                    branch: targetBranch,
                                    quantity: parseFloat(v.stock) || 0
                                }
                            },
                            variantValues: {
                                create: (v.attributeValueIds || []).map((id: string) => ({
                                    attributeValueId: id
                                }))
                            }
                        }
                    });

                    // Initial movement for child
                    if (parseFloat(v.stock) > 0) {
                        await tx.stockMovement.create({
                            data: {
                                productId: childProduct.id,
                                companyId: company.id,
                                branch: targetBranch,
                                quantity: parseFloat(v.stock),
                                price: parseFloat(v.buyPrice) || bPrice,
                                type: 'ADJUSTMENT',
                                referenceId: 'START'
                            }
                        });
                    }
                }
            }

            // Record initial movement for standalone product
            if (!isParent && initialQty > 0) {
                await tx.stockMovement.create({
                    data: {
                        productId: mainProduct.id,
                        companyId: company.id,
                        branch: targetBranch,
                        quantity: initialQty,
                        price: bPrice,
                        type: 'ADJUSTMENT' as any,
                        referenceId: 'START'
                    }
                });
            }

            // 3. Create Product Prices if provided
            if (body.prices && Array.isArray(body.prices)) {
                for (const p of body.prices) {
                    if (p.priceListId && p.price !== undefined) {
                        await tx.productPrice.create({
                            data: {
                                companyId: company.id,
                                productId: mainProduct.id,
                                priceListId: p.priceListId,
                                price: parseFloat(p.price),
                                isManualOverride: true // Always manual when set explicitly
                            }
                        });
                    }
                }
            }

            // Log activity
            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'CREATE',
                entity: 'Product',
                entityId: mainProduct.id,
                after: mainProduct,
                details: `${mainProduct.name} ${isParent ? 'ana ürün' : 'ürünü'} oluşturuldu.`,
                branch: session.branch as string
            });

            return mainProduct;
        });

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('Product create error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
