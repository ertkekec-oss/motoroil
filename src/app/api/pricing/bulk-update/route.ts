import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import { applyPricingFormula } from '@/lib/pricing';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();

        const {
            operation, // { type: 'PERCENT' | 'ABSOLUTE' | 'SET', value: number }
            scope, // { targetPriceListId: string, all?: boolean, productIds?: [], categoryIds?: [], brandIds?: [] }
            applyFormula, // { sourcePriceListId, markupBps, roundMode, roundStep }
            updatedBy
        } = body;

        // Mode 1: Apply Formula (e.g. Retail = Wholesale + 20%)
        if (applyFormula) {
            const { sourcePriceListId, markupBps, roundMode, roundStep, respectManualOverride } = applyFormula;
            const targetPriceListId = scope.targetPriceListId; // Must be present

            const count = await applyPricingFormula(
                ctx.companyId!,
                sourcePriceListId,
                targetPriceListId,
                markupBps,
                respectManualOverride,
                roundMode,
                roundStep
            );

            return apiResponse({ success: true, count, mode: 'FORMULA' }, { requestId: ctx.requestId });
        }

        // Mode 2: Bulk Update (increase existing prices by X% or set to Y)
        // This acts on *existing* ProductPrice entries for the target list

        const targetListId = scope.targetPriceListId;
        if (!targetListId) throw new Error("Target Price List ID required.");

        const where: any = {
            companyId: ctx.companyId!,
            priceListId: targetListId
        };

        if (!scope.all) {
            if (scope.productIds?.length) where.productId = { in: scope.productIds };
            // If category/brand provided, we need to join Product table. 
            // Prisma supports this in updateMany? No. 
            // We must find IDs first.
            if (scope.categoryIds?.length || scope.brandIds?.length) {
                const products = await prisma.product.findMany({
                    where: {
                        companyId: ctx.companyId!,
                        OR: [
                            scope.categoryIds?.length ? { category: { in: scope.categoryIds } } : {},
                            scope.brandIds?.length ? { brand: { in: scope.brandIds } } : {}
                        ]
                    },
                    select: { id: true }
                });
                const pIds = products.map(p => p.id);
                if (where.productId) {
                    // intersection
                    where.productId.in = where.productId.in.filter((id: string) => pIds.includes(id));
                } else {
                    where.productId = { in: pIds };
                }
            }
        }

        // Calculate and Update
        // Since updateMany cannot do math on existing field easily in Prisma (except increment/decrement which is absolute),
        // For PERCENTage updates, we might need raw query or loop.
        // Prisma `updateMany` supports `increment`, `decrement`, `multiply`, `divide`.
        // { price: { multiply: 1.10 } } works for Decimal?
        // Let's check Prisma docs. Yes, atomic number operations work on Int/Float/Decimal.

        // Handle Decimal updates using raw SQL for safety and performance
        // Note: Using Unsafe because dynamic table name/columns (though table is fixed here).
        // Where conditions are complex to build raw.
        // We can fetch IDs first, then use WHERE IN (...) which is safer.

        const targets = await prisma.productPrice.findMany({
            where,
            select: { id: true }
        });

        const ids = targets.map(t => t.id);
        if (ids.length === 0) return apiResponse({ success: true, count: 0 }, { requestId: ctx.requestId });

        const idList = ids.map(id => `'${id}'`).join(',');

        let count = 0;

        if (operation.type === 'PERCENT') {
            const multiplier = 1 + (operation.value / 100);
            count = await prisma.$executeRawUnsafe(
                `UPDATE "ProductPrice" SET "price" = "price" * ${multiplier}, "isManualOverride" = true WHERE "id" IN (${idList})`
            );
        } else if (operation.type === 'ABSOLUTE') {
            const val = operation.value;
            count = await prisma.$executeRawUnsafe(
                `UPDATE "ProductPrice" SET "price" = "price" + ${val}, "isManualOverride" = true WHERE "id" IN (${idList})`
            );
        } else if (operation.type === 'SET') {
            const val = operation.value;
            count = await prisma.$executeRawUnsafe(
                `UPDATE "ProductPrice" SET "price" = ${val}, "isManualOverride" = true WHERE "id" IN (${idList})`
            );
        }

        return apiResponse({ success: true, count: Number(count), mode: 'BULK_UPDATE' }, { requestId: ctx.requestId });

    } catch (error: any) {
        return apiError(error);
    }
}
