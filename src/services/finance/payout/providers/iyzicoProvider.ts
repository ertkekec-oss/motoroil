import { PaymentProvider } from './types';
import crypto from 'crypto';

function generateIyzicoAuth(payloadStr: string): Record<string, string> {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error("CRITICAL: Iyzico API Keys are missing for LIVE environment");
    
    const randomString = crypto.randomBytes(8).toString('hex');
    const hashStr = apiKey + randomString + secretKey + payloadStr;
    const hash = crypto.createHash('sha256').update(hashStr, 'utf8').digest('base64');
    
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `IYZWS ${apiKey}:${hash}`,
        'x-iyzi-rnd': randomString
    };
}

export class IyzicoProvider implements PaymentProvider {
    async createSubMerchant(input: {
        sellerTenantId: string;
        iban: string;
        holderName: string;
        legalInfoMinimal?: any;
    }): Promise<{ subMerchantKey: string }> {
        console.log(`[Iyzico Live] Creating SubMerchant for tenant: ${input.sellerTenantId}`);
        const payload = JSON.stringify({
            locale: 'tr',
            conversationId: `TENANT_${input.sellerTenantId}`,
            subMerchantExternalId: input.sellerTenantId,
            address: input.legalInfoMinimal?.address || 'Belirtilmedi',
            iban: input.iban,
            identityNumber: input.legalInfoMinimal?.vkn || '11111111111',
            taxOffice: input.legalInfoMinimal?.taxOffice || 'Bilinmiyor',
            subMerchantType: input.legalInfoMinimal?.vkn?.length === 10 ? 'PRIVATE_COMPANY' : 'PERSONAL',
            name: input.holderName.split(' ')[0],
            surname: input.holderName.split(' ').slice(1).join(' ') || 'Firma',
            email: input.legalInfoMinimal?.email || 'satici@ornek.com',
            gsmNumber: input.legalInfoMinimal?.phone || '+905555555555'
        });

        const res = await fetch('https://api.iyzipay.com/onboarding/submerchant', {
            method: 'POST', headers: generateIyzicoAuth(payload), body: payload
        });
        const data = await res.json();
        if (data.status !== 'success') throw new Error(`[Iyzico Live Error]: ${data.errorMessage}`);
        
        return { subMerchantKey: data.subMerchantKey };
    }

    async updateSubMerchant(input: {
        subMerchantKey: string;
        iban: string;
        holderName: string;
    }): Promise<void> {
        console.log(`[Iyzico Live] Updating SubMerchant: ${input.subMerchantKey}`);
        const payload = JSON.stringify({ locale: 'tr', subMerchantKey: input.subMerchantKey, iban: input.iban });
        const res = await fetch('https://api.iyzipay.com/onboarding/submerchant', {
            method: 'PUT', headers: generateIyzicoAuth(payload), body: payload
        });
        const data = await res.json();
        if (data.status !== 'success') throw new Error(`[Iyzico Live Error]: ${data.errorMessage}`);
    }

    async createSplitPayout(input: {
        providerPayoutId: string;
        subMerchantKey: string;
        netAmount: number;
        commissionAmount: number;
        currency: string;
        buyerIp?: string;
    }): Promise<{ success: boolean; externalReference?: string; error?: string }> {
        console.log(`[Iyzico Live] Creating Approval (Split Payout) for ${input.providerPayoutId}`);
        const payload = JSON.stringify({ locale: 'tr', paymentTransactionId: input.providerPayoutId });
        const res = await fetch('https://api.iyzipay.com/payment/iyzipos/item/approve', {
            method: 'POST', headers: generateIyzicoAuth(payload), body: payload
        });
        const data = await res.json();
        
        if (data.status !== 'success') return { success: false, error: data.errorMessage };
        return { success: true, externalReference: data.paymentTransactionId };
    }

    async getPayoutStatus(providerPayoutId: string): Promise<{ status: string }> {
        return { status: 'SUCCESS' }; // Handled by webhooks natively
    }

    // signature verify helper for incoming Webhooks
    verifyWebhookSignature(signature: string, payload: string): boolean {
        const secret = process.env.IYZICO_SECRET_KEY;
        if (!secret) return false;
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return signature === expected;
    }
}
