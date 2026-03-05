import { PaymentProvider } from "./PaymentProvider";

export class IyzicoProvider implements PaymentProvider {
    providerKey = "IYZICO";
    supportsDelayedPayout = true;
    supportsSplit = true;
    supportsHold = true; // For native escrow

    async createPaymentIntent(params: any): Promise<any> {
        console.log(`[IyzicoProvider] createPaymentIntent for order ${params.orderId}`);
        // Mock successful intent creation
        return {
            providerRef: `iyzico-intent-${params.idempotencyKey}`,
            status: "CREATED",
            redirectUrl: `https://checkout.iyzipay.com/demo/${params.idempotencyKey}`,
        };
    }

    async capturePayment(providerRef: string): Promise<any> {
        console.log(`[IyzicoProvider] capturePayment ${providerRef}`);
        return { status: "CAPTURED", metaJson: { capturedAt: new Date().toISOString() } };
    }

    async refundPayment(providerRef: string, amount?: number): Promise<any> {
        console.log(`[IyzicoProvider] refundPayment ${providerRef} (amount: ${amount})`);
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
            providerEventId: `msg_${Date.now()}_iyzico`,
        };
    }
}
