export type MarketplaceActionKey = "REFRESH_STATUS" | "PRINT_LABEL_A4" | "CHANGE_CARGO";
export type ActionStatus = "SUCCESS" | "FAILED" | "PENDING";

export interface MarketplaceActionResult {
    status: ActionStatus;
    auditId: string;
    result?: any;
    errorMessage?: string;
}

export interface MarketplaceActionInput {
    companyId: string;
    marketplace: "trendyol" | "hepsiburada" | "n11";
    orderId: string;
    actionKey: MarketplaceActionKey;
    idempotencyKey: string;
    payload?: {
        labelShipmentPackageId?: string;
        [key: string]: any;
    };
}

export interface MarketplaceActionProvider {
    executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult>;
}
