export type MarketplaceActionKey = "REFRESH_STATUS" | "PRINT_LABEL_A4" | "CHANGE_CARGO";
export type ActionStatus = "SUCCESS" | "FAILED" | "PENDING";

export enum MarketplaceActionErrorCode {
    E_CONFIG_MISSING = "E_CONFIG_MISSING",
    E_PROVIDER_AUTH = "E_PROVIDER_AUTH",
    E_RATE_LIMIT = "E_RATE_LIMIT",
    E_REMOTE_API_ERROR = "E_REMOTE_API_ERROR",
    E_VALIDATION = "E_VALIDATION",
    E_NETWORK = "E_NETWORK",
    E_NOT_FOUND = "E_NOT_FOUND",
    E_UNKNOWN = "E_UNKNOWN"
}

export interface MarketplaceActionResult {
    status: ActionStatus;
    auditId: string;
    result?: any;
    errorMessage?: string;
    errorCode?: MarketplaceActionErrorCode;
    httpStatus?: number;
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
