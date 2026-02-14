import { prismaBase as prisma } from '@/lib/prismaBase';
import { Decimal } from '@prisma/client/runtime/library';

// Helper types
export interface ResolvedPrice {
    priceList: { id: string; name: string; currency: string; isDefault: boolean };
    price: number;
    isOverride: boolean;
    notes?: string;
}

/**
 * Resolves the appropriate Price List for a given customer and company.
 * Order of precedence:
 * 1. Customer Override (priceListOverrideId)
 * 2. Customer Category Default (category.defaultPriceListId)
 * 3. Company Default Price List (isDefault=true)
 * 4. First Active Price List
 */
export async function resolveCustomerPriceList(companyId: string, customerId?: string) {
    let customer = null;
    let priceListId = null;

    if (customerId) {
        customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { category: true }
        });

        if (customer?.priceListOverrideId) {
            priceListId = customer.priceListOverrideId;
        } else if (customer?.category?.defaultPriceListId) {
            priceListId = customer.category.defaultPriceListId;
        }
    }

    if (!priceListId) {
        const defaultList = await prisma.priceList.findFirst({
            where: { companyId, isDefault: true, isActive: true }
        });
        priceListId = defaultList?.id;
    }

    // Fallback if no default found
    if (!priceListId) {
        const anyList = await prisma.priceList.findFirst({
            where: { companyId, isActive: true }
        });
        priceListId = anyList?.id;
    }

    if (!priceListId) throw new Error("No active price list found for company.");

    const priceList = await prisma.priceList.findUnique({ where: { id: priceListId } });
    return priceList!;
}

/**
 * Applies pricing formula to update target list based on source list.
 * @param companyId Tenant ID
 * @param sourceListId Source Price List ID (e.g. Wholesale)
 * @param targetListId Target Price List ID (e.g. Retail)
 * @param markupBps Basis Points for markup (e.g. 2000 = 20%, 500 = 5%)
 * @param respectManualOverride If true, skip products with 'isManualOverride' set in target
 * @param roundMode Rounding mode: NONE, UP, DOWN, NEAREST
 * @param roundStep Step for rounding (e.g. 0.99, 1.00, 5.00)
 */
export async function applyPricingFormula(
    companyId: string,
    sourceListId: string,
    targetListId: string,
    markupBps: number,
    respectManualOverride: boolean = true,
    roundMode: 'NONE' | 'UP' | 'DOWN' | 'NEAREST' = 'NONE',
    roundStep?: number
) {
    if (sourceListId === targetListId) throw new Error("Source and Target lists cannot be the same.");

    const sourcePrices = await prisma.productPrice.findMany({
        where: { companyId, priceListId: sourceListId }
    });

    let updatedCount = 0;

    for (const sp of sourcePrices) {
        const rawPrice = Number(sp.price);
        let validPrice = rawPrice * (1 + markupBps / 10000);

        // Apply Rounding
        if (roundMode !== 'NONE' && roundStep && roundStep > 0) {
            if (roundMode === 'UP') {
                validPrice = Math.ceil(validPrice / roundStep) * roundStep;
            } else if (roundMode === 'DOWN') {
                validPrice = Math.floor(validPrice / roundStep) * roundStep;
            } else if (roundMode === 'NEAREST') {
                validPrice = Math.round(validPrice / roundStep) * roundStep;
            }
        }

        // Check target existence
        const existingTarget = await prisma.productPrice.findUnique({
            where: {
                companyId_productId_priceListId: {
                    companyId,
                    productId: sp.productId,
                    priceListId: targetListId
                }
            }
        });

        if (existingTarget && existingTarget.isManualOverride && respectManualOverride) {
            continue; // Skip override
        }

        await prisma.productPrice.upsert({
            where: {
                companyId_productId_priceListId: {
                    companyId,
                    productId: sp.productId,
                    priceListId: targetListId
                }
            },
            create: {
                companyId,
                productId: sp.productId,
                priceListId: targetListId,
                price: new Decimal(validPrice),
                derivedFromListId: sourceListId,
                formulaMarkupBps: markupBps,
                isManualOverride: false
            },
            update: {
                price: new Decimal(validPrice),
                derivedFromListId: sourceListId,
                formulaMarkupBps: markupBps,
                isManualOverride: false // Reset override if we are forcing update (implied by passing here if respect=false)
            }
        });
        updatedCount++;
    }

    return updatedCount;
}

/**
 * Gets product price for a specific context.
 */
export async function getProductPrice(companyId: string, productId: string, priceListId: string) {
    const pp = await prisma.productPrice.findUnique({
        where: {
            companyId_productId_priceListId: { companyId, productId, priceListId }
        }
    });
    return pp ? Number(pp.price) : null;
}
