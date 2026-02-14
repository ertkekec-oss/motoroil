import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { id } = await params;
        const body = await req.json();

        // Used by Customers page to update category and override list
        // Expects { categoryId?, priceListOverrideId? }

        const existing = await prisma.customer.findUnique({ where: { id: id } });
        if (!existing || existing.companyId !== ctx.companyId) {
            return apiError({ message: 'Customer not found', status: 404 }, ctx.requestId);
        }

        const data: any = {};
        if (body.categoryId !== undefined) data.categoryId = body.categoryId;
        if (body.priceListOverrideId !== undefined) data.priceListOverrideId = body.priceListOverrideId;

        const updated = await prisma.customer.update({
            where: { id: id },
            data
        });

        return apiResponse(updated, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
