import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import { resolveCustomerPriceList } from '@/lib/pricing';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const { customerId } = await req.json();

        const priceList = await resolveCustomerPriceList(ctx.companyId!, customerId);

        return apiResponse({ priceList }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
