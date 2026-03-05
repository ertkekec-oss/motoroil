import { prisma } from '@/lib/prisma';
import { GateResult } from '@prisma/client';

export interface GateEvaluationParams {
    supplierTenantId: string;
    membershipId: string;
    orderDraftAmount?: number;
    orderDraftId?: string;
}

export async function evaluateEligibility({
    supplierTenantId,
    membershipId,
    orderDraftAmount = 0,
    orderDraftId
}: GateEvaluationParams): Promise<{ result: GateResult; reasonCodes: string[] }> {
    const reasons: string[] = [];
    let result: GateResult = 'ALLOWED';

    // 1. Agreement Status Check
    const agreement = await prisma.networkAgreement.findFirst({
        where: { supplierTenantId, membershipId, status: 'ACTIVE' },
        include: { policySnapshot: true }
    });

    if (!agreement) {
        reasons.push('AGREEMENT_MISSING');
        // Instantly blocked if no active agreement
        await logGateResult(supplierTenantId, membershipId, 'BLOCKED', reasons, orderDraftId);
        return { result: 'BLOCKED', reasonCodes: reasons };
    }

    const terms: any = agreement.policySnapshot?.termsJson || {};
    const escrowRules: string[] = terms.escrow?.rules || [];

    // 2. Policy: Minimum Order Amount
    if (terms.minOrderAmount && orderDraftAmount > 0 && orderDraftAmount < terms.minOrderAmount) {
        reasons.push('BELOW_MIN_ORDER');
        result = 'BLOCKED';
    }

    // 3. Policy: Credit Limit Exceeded
    if (terms.creditLimit) {
        // Normally sum the open AR balance + drafting amount. Placeholder for logic:
        const currentBalance = 0; // Replace with actual ERP query logic
        if (currentBalance + orderDraftAmount > terms.creditLimit) {
            reasons.push('LIMIT_EXCEEDED');
            result = 'BLOCKED';
        }
    }

    // 4. Mutabakat Gate (Reconciliation status)
    // Normally query external reconciliation module to check isOverdue.
    const isReconOverdue = false; // Mock
    if (isReconOverdue) {
        reasons.push('RECON_OVERDUE');
        if (escrowRules.includes('RECON_OVERDUE_30D') && result !== 'BLOCKED') {
            result = 'ESCROW_REQUIRED';
        } else {
            result = 'BLOCKED';
        }
    }

    // 5. Dispute Gate
    const openDisputesCount = await prisma.networkDisputeCase.count({
        where: { membershipId, supplierTenantId, status: { in: ['OPEN', 'UNDER_REVIEW'] } }
    });

    if (openDisputesCount > 0) {
        reasons.push('OPEN_DISPUTE');
        if (escrowRules.includes('DISPUTE_OPEN') && result !== 'BLOCKED') {
            result = 'ESCROW_REQUIRED';
        } else {
            // Supplier might heavily block any ordering if dispute exists
            result = 'BLOCKED';
        }
    }

    // Default escrow mode check
    if (terms.escrow?.mode === 'AUTO' && result === 'ALLOWED') {
        result = 'ESCROW_REQUIRED';
    }

    // Persist gate decision
    await logGateResult(supplierTenantId, membershipId, result, reasons, orderDraftId);

    return { result, reasonCodes: reasons };
}

async function logGateResult(supplierTenantId: string, membershipId: string, result: GateResult, reasonCodes: string[], orderDraftId?: string) {
    try {
        await prisma.networkGateResult.create({
            data: {
                supplierTenantId,
                membershipId,
                result,
                reasonCodesJson: reasonCodes,
                orderDraftId
            }
        });
    } catch (e) {
        console.error("Failed to log GateResult: ", e);
    }
}
