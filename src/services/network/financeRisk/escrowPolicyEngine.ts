import { PrismaClient, NetworkEscrowPolicyDecisionType } from '@prisma/client';
import { TradeRiskEngine } from './tradeRiskEngine';
import { RiskAuditService } from './riskAudit';

const prisma = new PrismaClient();

export class EscrowPolicyEngine {
    /**
     * Translates the dynamic trade risk score into an operative escrow release and lock strategy
     */
    static async buildEscrowPolicyDecision(escrowHoldId: string, context: { buyerTenantId: string, sellerTenantId: string }) {
        const riskScore = await TradeRiskEngine.recalculateCounterpartyPairRisk(context.buyerTenantId, context.sellerTenantId);

        let decisionType: NetworkEscrowPolicyDecisionType = 'STANDARD_ESCROW';
        let releaseStrategy = 'DELIVERY_CONDITION';
        let holdDays = 14;
        let disputeWindowHours = 72;
        let manualReviewRequired = false;

        if (riskScore.riskTier === 'VERY_LOW' || riskScore.riskTier === 'LOW') {
            decisionType = 'AUTO_APPROVED';
            releaseStrategy = 'FAST_TRACK_DELIVERY';
            holdDays = 3;
            disputeWindowHours = 48;
        } else if (riskScore.riskTier === 'HIGH') {
            decisionType = 'EXTENDED_HOLD';
            holdDays = 21;
            disputeWindowHours = 120; // 5 days
            manualReviewRequired = true;
        } else if (riskScore.riskTier === 'VERY_HIGH') {
            decisionType = 'BUYER_CONFIRMATION_REQUIRED';
            holdDays = 30;
            disputeWindowHours = 144; // 6 days
            manualReviewRequired = true;
        } else if (riskScore.riskTier === 'RESTRICTED') {
            decisionType = 'RESTRICTED_FLOW';
            releaseStrategy = 'MANUAL_AUTHORIZATION_ONLY';
            holdDays = 999;
            manualReviewRequired = true;
        }

        const policyDecision = await prisma.networkEscrowPolicyDecision.create({
            data: {
                escrowHoldId,
                buyerTenantId: context.buyerTenantId,
                sellerTenantId: context.sellerTenantId,
                riskScoreId: riskScore.id,
                decisionType,
                releaseStrategy,
                holdDays,
                disputeWindowHours,
                manualReviewRequired,
                notes: `Dynamic policy adapted for Risk Tier: ${riskScore.riskTier}`,
                explanationJson: { summary: "Generated intelligently from unified TradeRisk context" }
            }
        });

        RiskAuditService.recordEscrowPolicyDecision(escrowHoldId, policyDecision);
        return policyDecision;
    }
}
