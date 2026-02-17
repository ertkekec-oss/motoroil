import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

/**
 * POST /api/pricing/initialize
 * Initialize default price lists and categories for a company
 */
export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const companyId = ctx.companyId;

        if (!companyId) {
            return apiError({ message: 'Company ID is required', status: 400 });
        }

        // Check if already initialized
        const existingLists = await prisma.priceList.findMany({
            where: { companyId }
        });

        if (existingLists.length > 0) {
            return apiResponse({
                message: 'Price lists already initialized',
                priceLists: existingLists
            }, { requestId: ctx.requestId });
        }

        // Create default price lists
        const retailPriceList = await prisma.priceList.create({
            data: {
                companyId,
                name: 'Perakende',
                description: 'Varsayılan perakende fiyat listesi',
                currency: 'TRY',
                isDefault: true,
                isActive: true
            }
        });

        const wholesalePriceList = await prisma.priceList.create({
            data: {
                companyId,
                name: 'Toptan',
                description: 'Toptan satış fiyat listesi',
                currency: 'TRY',
                isDefault: false,
                isActive: true
            }
        });



        // Create default categories
        const retailCategory = await prisma.customerCategory.upsert({
            where: { companyId_name: { companyId, name: 'Perakende' } },
            create: {
                companyId,
                name: 'Perakende',
                description: 'Perakende müşteriler',
                priceListId: retailPriceList.id,
                isDefault: true
            },
            update: {
                priceListId: retailPriceList.id,
                isDefault: true
            }
        });

        const wholesaleCategory = await prisma.customerCategory.upsert({
            where: { companyId_name: { companyId, name: 'Toptan' } },
            create: {
                companyId,
                name: 'Toptan',
                description: 'Toptan müşteriler',
                priceListId: wholesalePriceList.id,
                isDefault: false
            },
            update: {
                priceListId: wholesalePriceList.id
            }
        });



        const uncategorizedCategory = await prisma.customerCategory.upsert({
            where: { companyId_name: { companyId, name: 'Kategorisiz' } },
            create: {
                companyId,
                name: 'Kategorisiz',
                description: 'Kategorisi belirlenmemiş müşteriler',
                priceListId: retailPriceList.id,
                isDefault: false
            },
            update: {}
        });



        // Assign uncategorized customers to default category
        await prisma.customer.updateMany({
            where: {
                companyId,
                categoryId: null
            },
            data: {
                categoryId: uncategorizedCategory.id
            }
        });

        return apiResponse({
            message: 'Price lists and categories initialized successfully',
            priceLists: [retailPriceList, wholesalePriceList],
            categories: [retailCategory, wholesaleCategory, uncategorizedCategory]
        }, { requestId: ctx.requestId });

    } catch (error: any) {
        console.error('Initialize pricing error:', error);
        return apiError(error);
    }
}
