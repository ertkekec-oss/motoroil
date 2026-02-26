export interface PaymentProvider {
    createSubMerchant(input: {
        sellerTenantId: string;
        iban: string;
        holderName: string;
        legalInfoMinimal?: any;
    }): Promise<{ subMerchantKey: string }>;

    updateSubMerchant(input: {
        subMerchantKey: string;
        iban: string;
        holderName: string;
    }): Promise<void>;

    createPaymentIntent?(input: any): Promise<any>;

    createSplitPayout(input: {
        providerPayoutId: string; // The idempotency reference 
        subMerchantKey: string;
        netAmount: number;
        commissionAmount: number;
        currency: string;
        buyerIp?: string;
    }): Promise<{ success: boolean; externalReference?: string; error?: string }>;

    getPayoutStatus(providerPayoutId: string): Promise<{ status: string }>;

    refundPayment?(input: any): Promise<any>;
}
