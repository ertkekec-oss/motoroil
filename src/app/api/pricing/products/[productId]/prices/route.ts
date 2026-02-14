import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { productId } = await params;

        const prices = await prisma.productPrice.findMany({
            where: {
                companyId: ctx.companyId!,
                productId: productId
            },
            include: {
                priceList: true
            }
        });

        return apiResponse(prices, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { productId } = await params;
        const body = await req.json();

        // Expects { priceListId, price, isManualOverride }

        const updated = await prisma.productPrice.upsert({
            where: {
                companyId_productId_priceListId: {
                    companyId: ctx.companyId!,
                    productId: productId,
                    priceListId: body.priceListId
                }
            },
            create: {
                companyId: ctx.companyId!,
                productId: productId,
                priceListId: body.priceListId,
                price: body.price,
                isManualOverride: body.isManualOverride ?? true
            },
            update: {
                price: body.price,
                isManualOverride: body.isManualOverride ?? true,
                derivedFromListId: null, // Clear derived info if manually set
                formulaMarkupBps: null
            }
        });

        return apiResponse(updated, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
