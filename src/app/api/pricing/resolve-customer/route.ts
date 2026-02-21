import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import { resolveCustomerPriceList } from '@/lib/pricing';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const { customerId } = await req.json();

        let companyId = ctx.companyId;
        if (!companyId) {
            const company = await prisma.company.findFirst({
                where: ctx.tenantId === 'PLATFORM_ADMIN' ? {} : { tenantId: ctx.tenantId },
                select: { id: true }
            });
            companyId = company?.id;
        }

        if (!companyId) {
            return apiError({ message: 'Firma bağlamı bulunamadı', status: 400 });
        }

        const priceList = await resolveCustomerPriceList(companyId, customerId);

        return apiResponse({ priceList }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
