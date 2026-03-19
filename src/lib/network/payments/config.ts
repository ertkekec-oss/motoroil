import { prismaRaw as prisma } from "@/lib/prisma";
import { PaymentProvider } from "./types";

/**
 * Assumption: You already have a TenantPaymentConfig (or similar) model.
 * Using configJson field.
 */
export type SupplierPaymentConfig = {
    provider: PaymentProvider;

    // shared
    environment: "SANDBOX" | "PRODUCTION";

    // iyzico
    iyzico?: {
        apiKey: string;
        secretKey: string;
        baseUrl: string; // https://sandbox-api.iyzipay.com or https://api.iyzipay.com
    };

    // odeal
    odeal?: {
        baseUrl: string; // https://api-stg.odeal.com or https://api.odeal.com
        clientId: string;
        clientSecret: string;
        scope: string; // docs say scope is sent
    };

    // webhook security (your own HMAC gate)
    webhook?: {
        secret: string;
    };
};

export async function getSupplierPaymentConfigOrThrow(supplierTenantId: string): Promise<SupplierPaymentConfig> {
    const row = await prisma.tenantPaymentConfig.findUnique({
        where: { tenantId: supplierTenantId },
        select: {
            provider: true,
            configJson: true
        },
    });

    if (!row) throw new Error("PAYMENT_CONFIG_NOT_FOUND");

    const provider = row.provider as PaymentProvider;
    const rawCfg = (row.configJson || {}) as any;
    const env = (rawCfg.environment ?? "PRODUCTION") as "SANDBOX" | "PRODUCTION";

    const cfg: SupplierPaymentConfig = {
        provider,
        environment: env,
        webhook: rawCfg.webhookSecret ? { secret: rawCfg.webhookSecret } : undefined,
    };

    if (provider === "IYZICO") {
        if (!rawCfg?.iyzicoApiKey || !rawCfg?.iyzicoSecretKey || !rawCfg?.iyzicoBaseUrl) throw new Error("IYZICO_CONFIG_INVALID");
        cfg.iyzico = { apiKey: rawCfg.iyzicoApiKey, secretKey: rawCfg.iyzicoSecretKey, baseUrl: rawCfg.iyzicoBaseUrl };
    }

    if (provider === "ODEAL") {
        if (!rawCfg?.odealBaseUrl || !rawCfg?.odealClientId || !rawCfg?.odealClientSecret || !rawCfg?.odealScope) {
            throw new Error("ODEAL_CONFIG_INVALID");
        }
        cfg.odeal = {
            baseUrl: rawCfg.odealBaseUrl,
            clientId: rawCfg.odealClientId,
            clientSecret: rawCfg.odealClientSecret,
            scope: rawCfg.odealScope,
        };
    }

    return cfg;
}
