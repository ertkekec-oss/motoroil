export function projectEscrowForTenant(escrow: any) {
    if (!escrow) return null;

    return {
        id: escrow.id,
        orderId: escrow.orderId,
        buyerTenantId: escrow.buyerTenantId,
        sellerTenantId: escrow.sellerTenantId,
        amount: escrow.amount,
        currency: escrow.currency,
        status: escrow.status,
        releaseDelayHours: escrow.releaseDelayHours,
        createdAt: escrow.createdAt,
        releasedAt: escrow.releasedAt,
        refundedAt: escrow.refundedAt,

        // Hide internal audit timeline/source logic
        timelineSummary: escrow.lifecycleEvents ? escrow.lifecycleEvents.map((evt: any) => ({
            status: evt.newState,
            createdAt: evt.createdAt
        })) : []
    };
}

export function projectEscrowForAdmin(escrow: any) {
    if (!escrow) return null;

    return {
        id: escrow.id,
        orderId: escrow.orderId,
        buyerTenantId: escrow.buyerTenantId,
        sellerTenantId: escrow.sellerTenantId,
        amount: escrow.amount,
        currency: escrow.currency,
        status: escrow.status,
        releaseStrategy: escrow.releaseStrategy,
        releaseDelayHours: escrow.releaseDelayHours,
        createdAt: escrow.createdAt,
        updatedAt: escrow.updatedAt,
        releasedAt: escrow.releasedAt,
        refundedAt: escrow.refundedAt,

        // Full ledger events
        lifecycleEvents: escrow.lifecycleEvents,

        // Let UI fetch real transactions if populated
        transactions: escrow.escrowAccount?.transactions
    };
}
