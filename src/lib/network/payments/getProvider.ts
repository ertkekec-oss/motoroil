import { getSupplierPaymentConfigOrThrow } from "./config";
import { PaymentProviderAdapter } from "./types";
import { createIyzicoAdapter } from "./providers/iyzico";
import { createOdealAdapter } from "./providers/odeal";

export async function getPaymentProviderAdapter(supplierTenantId: string): Promise<PaymentProviderAdapter> {
    const cfg = await getSupplierPaymentConfigOrThrow(supplierTenantId);

    switch (cfg.provider) {
        case "IYZICO":
            return createIyzicoAdapter(cfg);
        case "ODEAL":
            return createOdealAdapter(cfg);
        default:
            throw new Error("PAYMENT_PROVIDER_NOT_SUPPORTED");
    }
}
