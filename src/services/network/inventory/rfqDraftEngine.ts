import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';

export async function generateAutoRFQ(opportunityId: string, tenantId: string) {
    const opportunity = await prisma.networkTradeOpportunity.findUnique({
        where: { id: opportunityId },
        include: {
            supplierProfile: true,
            buyerProfile: true
        }
    });

    if (!opportunity) throw new Error("Opportunity not found");

    if (opportunity.buyerProfile.tenantId !== tenantId) {
        throw new Error("Unauthorized to access this opportunity");
    }

    console.log(`[RFQ Draft Engine] Generating Auto Draft for Opportunity ${opportunityId}...`);

    // In a full implementation, we would create a Draft RFQ in the ERP/RFQ module here.
    // Given the constraints, we will just simulate the payload and log the event.

    const mockDraftPayload = {
        title: `Suggested RFQ - Category ${opportunity.categoryId}`,
        status: 'DRAFT',
        supplierCompanyId: opportunity.supplierProfile.id,
        buyerCompanyId: opportunity.buyerProfile.id,
        confidenceDesc: `${Math.round(opportunity.confidence)}% AI Matching Score`,
        suggestedDate: new Date()
    };

    await publishEvent({
        type: 'NETWORK_RFQ_DRAFT_GENERATED',
        tenantId,
        meta: {
            opportunityId,
            draftPayload: mockDraftPayload,
            buyerId: opportunity.buyerProfile.tenantId,
            supplierId: opportunity.supplierProfile.tenantId
        }
    });

    return { success: true, draft: mockDraftPayload };
}
