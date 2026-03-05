export interface PaymentProvider {
    providerKey: string;
    supportsDelayedPayout: boolean;
    supportsSplit: boolean;
    supportsHold: boolean;

    createPaymentIntent(params: {
        amount: number;
        currency: string;
        orderId: string;
        buyerInfo: any;
        idempotencyKey: string;
    }): Promise<{
        providerRef: string;
        status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED";
        metaJson?: any;
        redirectUrl?: string;
    }>;

    capturePayment(providerRef: string): Promise<{
        status: "CAPTURED" | "FAILED";
        metaJson?: any;
    }>;

    refundPayment(providerRef: string, amount?: number): Promise<{
        status: "REFUNDED" | "FAILED";
        metaJson?: any;
    }>;

    getPaymentStatus(providerRef: string): Promise<{
        status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "CANCELED" | "REFUNDED";
        metaJson?: any;
    }>;

    verifyWebhook(headers: Record<string, string>, rawBody: Buffer): Promise<{
        valid: boolean;
        eventType?: string;
        providerEventId?: string;
        payload?: any;
    }>;
}
