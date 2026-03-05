import { PayoutProvider } from "./PayoutProvider";
import { ManualBankPayoutProvider } from "./manual";

const payoutProviders: Record<string, PayoutProvider> = {
    "manual_bank": new ManualBankPayoutProvider(),
    // Further provider integrations like Iyzico/Odeal for payouts can be registered here
};

export function getPayoutProvider(providerKey: string): PayoutProvider {
    const provider = payoutProviders[providerKey];
    if (!provider) {
        throw new Error(`Unsupported payout provider: ${providerKey}`);
    }
    return provider;
}
