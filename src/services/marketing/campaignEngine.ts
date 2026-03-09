import { prisma } from '@/lib/prisma';

export type CampaignChannelType = 'POS' | 'SALES_REP' | 'B2B' | 'HUB' | 'MANUAL' | 'GLOBAL';

export interface CampaignEngineContext {
    tenantId: string;
    companyId: string;
    channel: CampaignChannelType;
    customerId?: string;
    customerSegment?: string;
    cartItems: {
        productId: string;
        quantity: number;
        price: number;
        categoryId?: string;
    }[];
    salesRepId?: string;
    regionId?: string;
}

export interface CampaignDiscount {
    campaignId: string;
    campaignName: string;
    type: string;
    discountAmount: number;
    description: string;
}

export class CampaignEngine {
    static async evaluate(context: CampaignEngineContext): Promise<{
        originalTotal: number;
        discountTotal: number;
        finalTotal: number;
        appliedCampaigns: CampaignDiscount[];
    }> {
        const { tenantId, companyId, channel, cartItems } = context;

        let originalTotal = 0;
        for (const item of cartItems) {
            originalTotal += item.price * item.quantity;
        }

        // Fetch active campaigns for the tenant/company and requested channel
        // Active campaigns means valid dates, status ACTIVE, and matching channel or GLOBAL
        const now = new Date();
        const campaigns = await prisma.campaign.findMany({
            where: {
                tenantId: tenantId,
                companyId: companyId,
                status: 'ACTIVE',
                isActive: true, // legacy compatibility
                deletedAt: null,
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: now } }
                ],
                AND: [
                    {
                        OR: [
                            { validUntil: null },
                            { validUntil: { gte: now } }
                        ]
                    }
                ],
                channels: {
                    hasSome: [channel, 'GLOBAL']
                }
            },
            orderBy: {
                priority: 'desc'
            }
        });

        const appliedCampaigns: CampaignDiscount[] = [];
        let discountTotal = 0;
        let finalTotal = originalTotal;

        for (const campaign of campaigns) {
            // Check condition restrictions
            if (campaign.minOrderAmount && originalTotal < campaign.minOrderAmount) {
                continue;
            }

            const totalQuantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);
            if (campaign.minQuantity && totalQuantity < campaign.minQuantity) {
                continue;
            }

            if (campaign.salesRepId && context.salesRepId !== campaign.salesRepId) {
                continue;
            }

            if (campaign.customerSegment && context.customerSegment !== campaign.customerSegment) {
                continue;
            }

            if (campaign.regionId && context.regionId !== campaign.regionId) {
                continue;
            }

            // Target Products logic
            let eligibleItems = cartItems;
            if (campaign.productIds && campaign.productIds.length > 0) {
                eligibleItems = eligibleItems.filter(i => campaign.productIds.includes(i.productId));
            }
            if (campaign.categoryIds && campaign.categoryIds.length > 0) {
                eligibleItems = eligibleItems.filter(i => i.categoryId && campaign.categoryIds.includes(i.categoryId));
            }

            if (eligibleItems.length === 0 && (campaign.productIds.length > 0 || campaign.categoryIds.length > 0)) {
                continue;
            }

            // Calculate discount for this campaign
            let currentDiscount = 0;

            if (campaign.type === 'PERCENT_DISCOUNT' || campaign.type === 'percent_discount') {
                const eligibleTotal = eligibleItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                const rate = campaign.discountRate || 0;
                currentDiscount = eligibleTotal * (rate / 100);
            } else if (campaign.type === 'FIXED_DISCOUNT' || campaign.type === 'fixed_discount') {
                currentDiscount = campaign.discountRate || 0;
            } else if (campaign.type === 'BUY_X_GET_Y') {
                // Implementation for Buy X Get Y
                // Using conditions json or minQuantity
            }

            if (currentDiscount > 0) {
                // Cap the discount to prevent negative totals
                if (currentDiscount > finalTotal) {
                    currentDiscount = finalTotal;
                }

                appliedCampaigns.push({
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    type: campaign.type,
                    discountAmount: currentDiscount,
                    description: `'${campaign.name}' kampanyası uygulandı`
                });

                discountTotal += currentDiscount;
                finalTotal -= currentDiscount;

                if (campaign.stackingRule === 'EXCLUSIVE') {
                    // exclusive stops processing further
                    break;
                } else if (campaign.stackingRule === 'PRIORITY_ONLY') {
                    // priority only means only apply this and stop if others are same priority (custom rule handling)
                    // For now, treat PRIORITY_ONLY as exclusive if we already applied one
                    break;
                }
            }
        }

        return {
            originalTotal,
            discountTotal,
            finalTotal,
            appliedCampaigns
        };
    }
}
