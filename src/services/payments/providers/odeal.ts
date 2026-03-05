import { PaymentProvider } from "./PaymentProvider";

export class OdealProvider implements PaymentProvider {
    providerKey = "ODEAL";
    supportsDelayedPayout = false;
    supportsSplit = false;
    supportsHold = false; // Does not support native hold, relies on OPERATIONAL

    async createPaymentIntent(params: any): Promise<any> {
        console.log(`[OdealProvider] createPaymentIntent for order ${params.orderId}`);
        // Mock successful intent creation
        return {
            providerRef: `odeal-intent-${params.idempotencyKey}`,
            status: "CREATED",
            redirectUrl: `https://odeal.com/pay/${params.idempotencyKey}`,
        };
    }

    async capturePayment(providerRef: string): Promise<any> {
        console.log(`[OdealProvider] capturePayment ${providerRef}`);
        return { status: "CAPTURED", metaJson: { capturedAt: new Date().toISOString() } };
    }

    async refundPayment(providerRef: string, amount?: number): Promise<any> {
        console.log(`[OdealProvider] refundPayment ${providerRef}`);
        return { status: "REFUNDED" };
    }

    async getPaymentStatus(providerRef: string): Promise<any> {
        return { status: "CAPTURED" };
    }

    async verifyWebhook(headers: Record<string, string>, rawBody: Buffer): Promise<any> {
        // Mock valid webhook
        return {
            valid: true,
            eventType: "PAYMENT_CAPTURED",
            providerEventId: `msg_${Date.now()}_odeal`,
        };
    }
}
