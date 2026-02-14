import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { id } = await params;
        const body = await req.json();

        // Enforce update only on same company
        const existing = await prisma.priceList.findUnique({
            where: { id: id }
        });

        if (!existing || existing.companyId !== ctx.companyId) {
            return apiError({ message: 'Price list not found', status: 404 }, ctx.requestId);
        }

        if (body.isDefault) {
            await prisma.priceList.updateMany({
                where: { companyId: ctx.companyId!, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const updated = await prisma.priceList.update({
            where: { id: id },
            data: {
                name: body.name,
                currency: body.currency,
                isDefault: body.isDefault,
                isActive: body.isActive
            }
        });
        return apiResponse(updated, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await getRequestContext(req);
        const { id } = await params;

        const existing = await prisma.priceList.findUnique({ where: { id: id } });
        if (!existing || existing.companyId !== ctx.companyId) {
            return apiError({ message: 'Price list not found', status: 404 }, ctx.requestId);
        }

        // Prevent delete if default
        if (existing.isDefault) {
            return apiError({ message: 'Cannot delete default price list', status: 400 }, ctx.requestId);
        }

        await prisma.priceList.delete({ where: { id: id } });
        return apiResponse({ success: true }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
