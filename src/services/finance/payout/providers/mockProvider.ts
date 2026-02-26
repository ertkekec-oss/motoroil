import { PaymentProvider } from './types';
import crypto from 'crypto';

export class MockProvider implements PaymentProvider {
    async createSubMerchant(input: {
        sellerTenantId: string;
        iban: string;
        holderName: string;
        legalInfoMinimal?: any;
    }): Promise<{ subMerchantKey: string }> {
        // mock return
        return { subMerchantKey: `mock_smk_${Date.now()}` };
    }

    async updateSubMerchant(input: {
        subMerchantKey: string;
        iban: string;
        holderName: string;
    }): Promise<void> {
        // mock no-op update
    }

    async createSplitPayout(input: {
        providerPayoutId: string;
        subMerchantKey: string;
        netAmount: number;
        commissionAmount: number;
        currency: string;
        buyerIp?: string;
    }): Promise<{ success: boolean; externalReference?: string; error?: string }> {
        // Simulate successful trigger
        return { success: true, externalReference: `ext_ref_${Date.now()}` };
    }

    async getPayoutStatus(providerPayoutId: string): Promise<{ status: string }> {
        return { status: 'SUCCEEDED' };
    }
}
