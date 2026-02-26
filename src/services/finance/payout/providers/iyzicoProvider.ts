import { PaymentProvider } from './types';
import crypto from 'crypto';

export class IyzicoProvider implements PaymentProvider {
    async createSubMerchant(input: {
        sellerTenantId: string;
        iban: string;
        holderName: string;
        legalInfoMinimal?: any;
    }): Promise<{ subMerchantKey: string }> {
        // Implement iyzico sub-merchant creation logic using real API
        throw new Error('Not implemented for demo, use MockProvider');
    }

    async updateSubMerchant(input: {
        subMerchantKey: string;
        iban: string;
        holderName: string;
    }): Promise<void> {
        // Implement iyzico update
        throw new Error('Not implemented');
    }

    async createSplitPayout(input: {
        providerPayoutId: string;
        subMerchantKey: string;
        netAmount: number;
        commissionAmount: number;
        currency: string;
        buyerIp?: string;
    }): Promise<{ success: boolean; externalReference?: string; error?: string }> {
        throw new Error('Not implemented');
    }

    async getPayoutStatus(providerPayoutId: string): Promise<{ status: string }> {
        throw new Error('Not implemented');
    }

    // signature verify helper
    verifyWebhookSignature(signature: string, payload: string): boolean {
        const secret = process.env.IYZICO_SECRET_KEY || 'dummy_secret';
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return signature === expected;
    }
}
