export interface PayoutProvider {
    providerKey: string;
    supportsTransfers: boolean;
    supportsBatchTransfers: boolean;
    providesWebhook: boolean;

    initiateTransfer(params: {
        amount: number;
        currency: string;
        iban: string;
        reference: string;
        idempotencyKey: string;
        receiverInfo?: any;
    }): Promise<{
        providerRef: string;
        status: "PENDING" | "EXECUTING" | "SETTLED" | "FAILED";
        metaJson?: any;
    }>;

    getTransferStatus(providerRef: string): Promise<{
        status: "PENDING" | "EXECUTING" | "SETTLED" | "FAILED";
        metaJson?: any;
    }>;

    verifyWebhook(headers: Record<string, string>, rawBody: Buffer): Promise<{
        valid: boolean;
        eventType?: string;
        providerEventId?: string;
        payload?: any;
    }>;
}
