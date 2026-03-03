export type PaymentProvider = "IYZICO" | "ODEAL";

export type PaymentCurrency = "TRY" | "USD" | "EUR";

export type PaymentIntentStatus =
    | "CREATED"          // intent created, awaiting user action
    | "REQUIRES_ACTION"  // redirect issued
    | "PROCESSING"       // callback received, verifying
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED";

export type PaymentScope = "DEALER_B2B" | "GLOBAL_B2B" | "TENANT_PACKAGE";

export type ProviderCreateIntentInput = {
    intentId: string;
    scope: PaymentScope;

    // money
    amount: string;   // decimal string "123.45"
    currency: PaymentCurrency;

    // routing
    successUrl: string; // where user sees success
    failUrl: string;    // where user sees fail/cancel
    callbackBaseUrl: string; // absolute base like https://app.domain.com

    // business references
    orderId?: string;
    dealerMembershipId?: string;
    supplierTenantId: string;

    // buyer info (optional)
    buyer?: {
        name?: string;
        email?: string;
        phoneE164?: string;
        city?: string;
        address?: string;
    };

    // idempotency (you already use)
    idempotencyKey: string;
};

export type ProviderCreateIntentResult = {
    provider: PaymentProvider;
    referenceCode: string;     // provider token/id/externalId
    redirectUrl: string;       // where to send user
    raw?: unknown;             // provider raw payload (stored in providerData)
};

export type ProviderVerifyResult = {
    status: "SUCCEEDED" | "FAILED" | "CANCELLED" | "PROCESSING";
    paidAmount?: string; // decimal string
    raw?: unknown;
};

export interface PaymentProviderAdapter {
    createIntent(input: ProviderCreateIntentInput): Promise<ProviderCreateIntentResult>;
    verifyWithCallback(input: { referenceCode: string; payload: any; intentId?: string }): Promise<ProviderVerifyResult>;
    refund(input: ProviderRefundInput): Promise<ProviderRefundResult>;
}

export type ProviderRefundInput = {
    intentId?: string;
    referenceCode: string;  // provider payment reference/token/id
    amount: string;         // decimal string
    currency: string;       // TRY
    reason?: string;
    idempotencyKey: string;
};

export type ProviderRefundResult = {
    status: "SUCCEEDED" | "FAILED" | "PROCESSING";
    providerRefundId?: string;
    raw?: unknown;
};
