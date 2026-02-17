import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const categories = await prisma.customerCategory.findMany({
            where: { companyId: ctx.companyId! },
            include: {
                priceList: true,
                _count: {
                    select: { customers: true }
                }
            },
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' }
            ]
        });
        return apiResponse(categories, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();

        // Check duplicate name
        const existing = await prisma.customerCategory.findUnique({
            where: { companyId_name: { companyId: ctx.companyId!, name: body.name } }
        });

        if (existing) {
            return apiError({ message: 'Category with this name already exists', status: 400 }, ctx.requestId);
        }

        const category = await prisma.customerCategory.create({
            data: {
                companyId: ctx.companyId!,
                name: body.name,
                description: body.description,
                priceListId: body.priceListId,
                isDefault: body.isDefault || false
            },
            include: {
                priceList: true
            }
        });

        return apiResponse(category, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error);
    }
}
