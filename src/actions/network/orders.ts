"use server";

import { evaluateEligibility } from '@/services/network/gate/eligibility';
import { prisma } from '@/lib/prisma';
import { EscrowStatus, HoldMode } from '@prisma/client';

export async function createB2BOrder(
    supplierTenantId: string,
    membershipId: string,
    dealerTenantId: string | null,
    totalAmount: number
) {
    // 1. Run Gate Engine BEFORE placing the order
    const { result, reasonCodes } = await evaluateEligibility({
        supplierTenantId,
        membershipId,
        orderDraftAmount: totalAmount
    });

    if (result === 'BLOCKED') {
        return { success: false, status: 'BLOCKED', reasons: reasonCodes };
    }

    // 2. Mock Order Creation
    // Periodya's core order model doesn't explicitly have B2B status flag in standard ERP schema, so we do MVP
    const orderRef = `B2B-ORD-${Date.now()}`;

    // 3. Handle Escrow Requirement
    if (result === 'ESCROW_REQUIRED') {
        // Create an Escrow Case
        await prisma.escrowCase.create({
            data: {
                supplierTenantId,
                membershipId,
                orderId: orderRef,
                amount: totalAmount,
                currency: 'TRY',
                status: EscrowStatus.REQUIRED,
                holdMode: HoldMode.OPERATIONAL,
                providerKey: 'manual'
            }
        });

        return {
            success: true,
            status: 'PENDING_ESCROW',
            orderRef,
            message: 'Order created but is in PENDING_ESCROW state. Funds will be held or operational lock applied.'
        };
    }

    // 4. Allowed Normal Flow
    return {
        success: true,
        status: 'PROCESSING',
        orderRef,
        message: 'Order placed successfully and allowed by Supplier Contract Policy.'
    };
}
