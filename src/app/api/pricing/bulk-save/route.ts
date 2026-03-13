import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const { listId, prices } = await req.json(); // prices: { productId: newPrice }

        if (!listId || !prices || Object.keys(prices).length === 0) {
            throw new Error("Geçersiz veri aktarımı.");
        }

        if (listId === 'default') {
            await prisma.$transaction(
                Object.keys(prices).map(id => 
                    prisma.product.update({
                        where: { id, companyId: ctx.companyId! },
                        data: { price: prices[id] }
                    })
                )
            );
        } else if (listId === 'buy_price') {
             await prisma.$transaction(
                Object.keys(prices).map(id => 
                    prisma.product.update({
                        where: { id, companyId: ctx.companyId! },
                        data: { buyPrice: prices[id] }
                    })
                )
            );
        } else {
            // Upsert product prices for custom list
            await prisma.$transaction(
                Object.keys(prices).map(id => 
                    prisma.productPrice.upsert({
                        where: {
                            companyId_productId_priceListId: {
                                companyId: ctx.companyId!,
                                productId: id,
                                priceListId: listId
                            }
                        },
                        update: {
                            price: prices[id],
                            isManualOverride: true
                        },
                        create: {
                            companyId: ctx.companyId!,
                            productId: id,
                            priceListId: listId,
                            price: prices[id],
                            isManualOverride: true
                        }
                    })
                )
            );
        }

        return apiResponse({ success: true, message: "Fiyatlar başarıyla güncellendi." });
    } catch (e: any) {
        return apiError(e);
    }
}
