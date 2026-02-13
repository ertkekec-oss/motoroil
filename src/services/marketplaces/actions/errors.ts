import { MarketplaceActionErrorCode } from "./types";

export class MarketplaceActionError extends Error {
    constructor(
        message: string,
        public readonly errorCode: MarketplaceActionErrorCode = MarketplaceActionErrorCode.E_UNKNOWN,
        public readonly isRetryable: boolean = true
    ) {
        super(message);
        this.name = "MarketplaceActionError";
    }
}

/**
 * Classifies an error and determines if it should be retried in the queue.
 */
export function classifyMarketplaceError(error: any): MarketplaceActionError {
    if (error instanceof MarketplaceActionError) {
        return error;
    }

    const message = error?.message || "Unknown marketplace error";

    // Non-retryable errors (Config missing, validation, not found)
    if (message.includes("Yapılandırma bulunamadı") || message.includes("not found")) {
        return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_CONFIG_MISSING, false);
    }

    if (message.includes("gerekli") || message.includes("required") || message.includes("Validation")) {
        return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_VALIDATION, false);
    }

    // Rate limit errors (Retryable, but maybe with backoff)
    if (message.includes("Too Many Requests") || message.includes("rate limit") || error?.status === 429) {
        return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_RATE_LIMIT, true);
    }

    // Authentication errors (Non-retryable usually, needs human intervention)
    if (error?.status === 401 || error?.status === 403 || message.includes("Unauthorized")) {
        return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_PROVIDER_AUTH, false);
    }

    // Network errors (Retryable)
    if (message.includes("ECONNRESET") || message.includes("ETIMEDOUT") || message.includes("network")) {
        return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_NETWORK, true);
    }

    // Default to retryable unknown error
    return new MarketplaceActionError(message, MarketplaceActionErrorCode.E_REMOTE_API_ERROR, true);
}
