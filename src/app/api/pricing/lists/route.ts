import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        let companyId = ctx.companyId;
        if (!companyId) {
            const company = await prisma.company.findFirst({ where: { tenantId: ctx.tenantId }, select: { id: true } });
            companyId = company?.id;
        }

        if (!companyId) return apiError({ message: 'Firma bulunamadı', status: 400 });

        const lists = await prisma.priceList.findMany({
            where: { companyId },
            orderBy: { isDefault: 'desc' }
        });
        return apiResponse(lists, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();
        const { name, currency, isDefault } = body;

        // If setting as default, unset others first
        if (isDefault) {
            await prisma.priceList.updateMany({
                where: { companyId: ctx.companyId!, isDefault: true },
                data: { isDefault: false }
            });
        }

        const list = await prisma.priceList.create({
            data: {
                companyId: ctx.companyId!,
                name,
                currency,
                isDefault,
                isActive: true
            }
        });

        return apiResponse(list, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
