import { NetworkPayment, PaymentProvider } from '@prisma/client';

export interface ReleaseFundsResult {
    success: boolean;
    providerEventId?: string;
    errorMessage?: string;
    rawPayload?: any;
}

/**
 * Mock implementation of releasing funds via Escrow Payment Provider.
 * Integrated logic would vary per provider (e.g. Iyzico SubMerchant Approval API).
 */
export async function releaseFunds(payment: NetworkPayment): Promise<ReleaseFundsResult> {
    const { provider, providerPaymentId, amount } = payment;

    console.log(`[Escrow Release] Initiating release for payment: ${payment.id} via ${provider}`);

    // Environment Kill Switch
    if (process.env.ESCROW_RELEASE_ENABLED === 'false') {
        throw new Error("Escrow disabled by ops");
    }

    // Simulate real world API call latency 
    await new Promise((resolve) => setTimeout(resolve, 800));

    // For Mock Provider: Always successful
    // In a real integration: you would map to the provider's SDK or HTTP endpoint.
    // e.g., iyzico.approval.create({ paymentTransactionId: providerPaymentId })

    const mockEventId = `payout_evt_${Date.now()}`;
    const txReceipt = {
        mockReceiptId: `rcpt_${Math.floor(Math.random() * 1000000)}`,
        releasedAmount: amount,
        status: "APPROVED"
    };

    return {
        success: true,
        providerEventId: mockEventId,
        rawPayload: txReceipt
    };
}
