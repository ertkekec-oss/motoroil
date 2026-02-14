import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { id } = await params;

        // Fetch all prices for this list
        // Optimization: return only productId and price
        const prices = await prisma.productPrice.findMany({
            where: {
                companyId: ctx.companyId!,
                priceListId: id
            },
            select: {
                productId: true,
                price: true
            }
        });

        // Convert to map
        const priceMap: Record<string, number> = {};
        prices.forEach(p => {
            priceMap[p.productId] = Number(p.price);
        });

        return apiResponse({ priceMap }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
