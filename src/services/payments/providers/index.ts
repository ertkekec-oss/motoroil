import { PaymentProvider } from "./PaymentProvider";
import { IyzicoProvider } from "./iyzico";
import { OdealProvider } from "./odeal";

const providers: Record<string, PaymentProvider> = {
    "IYZICO": new IyzicoProvider(),
    "ODEAL": new OdealProvider(),
};

/**
 * Get the installed payment provider by its key.
 */
export function getPaymentProvider(providerKey: string): PaymentProvider {
    const provider = providers[providerKey.toUpperCase()];
    if (!provider) {
        throw new Error(`Unsupported payment provider: ${providerKey}`);
    }
    return provider;
}
