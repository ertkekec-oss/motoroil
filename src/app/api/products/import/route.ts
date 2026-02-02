import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { products } = body;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ success: false, error: 'No products provided' }, { status: 400 });
        }

        const results = {
            created: 0,
            updated: 0,
            errors: [] as string[]
        };

        // Process in a transaction for safety, or parallel promises if performance is key?
        // Transaction is safer but slower for huge lists. Let's use parallel promises with individual error handling for now,
        // or a dedicated bulk upsert if Prisma supported, but product + stocks logic is complex.
        // We will loop and use upsert logic.

        for (const p of products) {
            try {
                // Check if exists by Code
                const existing = await prisma.product.findFirst({
                    where: { code: p.code }
                });

                if (existing) {
                    // Update
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            name: p.name,
                            barcode: p.barcode,
                            category: p.category,
                            brand: p.brand,
                            buyPrice: p.buyPrice,
                            price: p.price,
                            salesVat: p.salesVat,
                            salesVatIncluded: p.salesVatIncluded,
                            purchaseVat: p.purchaseVat,
                            purchaseVatIncluded: p.purchaseVatIncluded,
                            stock: p.stock, // Update total stock? Or complex stock logic? User just wants to overwrite.
                            supplier: p.supplier
                        }
                    });

                    // Update Stock table for the branch
                    const branchName = p.branch || 'Merkez';
                    await prisma.stock.upsert({
                        where: {
                            productId_branch: {
                                productId: existing.id,
                                branch: branchName
                            }
                        },
                        create: {
                            productId: existing.id,
                            branch: branchName,
                            quantity: p.stock
                        },
                        update: {
                            quantity: p.stock
                        }
                    });

                    results.updated++;
                } else {
                    // Create
                    const branchName = p.branch || 'Merkez';
                    const newProduct = await prisma.product.create({
                        data: {
                            name: p.name,
                            code: p.code,
                            barcode: p.barcode,
                            category: p.category,
                            brand: p.brand,
                            buyPrice: p.buyPrice,
                            price: p.price,
                            salesVat: p.salesVat,
                            salesVatIncluded: p.salesVatIncluded,
                            purchaseVat: p.purchaseVat,
                            purchaseVatIncluded: p.purchaseVatIncluded,
                            stock: p.stock,
                            supplier: p.supplier,
                            branch: 'Merkez', // Main branch ref
                            stocks: {
                                create: {
                                    branch: branchName,
                                    quantity: p.stock
                                }
                            }
                        }
                    });
                    results.created++;
                }
            } catch (err: any) {
                console.error(`Error processing product ${p.code}:`, err);
                results.errors.push(`${p.name} (${p.code}): ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Bulk import error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
