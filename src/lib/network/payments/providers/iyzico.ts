import { SupplierPaymentConfig } from "../config";
import { fetchJson } from "../http";
import { PaymentProviderAdapter, ProviderCreateIntentInput, ProviderCreateIntentResult, ProviderVerifyResult, ProviderRefundInput, ProviderRefundResult } from "../types";
import crypto from "crypto";

/**
 * IYZICO IYZWSv2 signature generation (aligned with iyzipay-node utils.js)
 * signature = HMAC_SHA256_HEX(secretKey, randomString + uri + JSON.stringify(body))
 * authParams = base64("apiKey:<apiKey>&randomKey:<randomString>&signature:<signature>")
 * Authorization: "IYZWSv2 <authParams>"
 */
function iyzicoAuthV2(params: { apiKey: string; secretKey: string; uriPath: string; body: any }) {
    const randomString = `${process.hrtime()[0]}${Math.random().toString(10).slice(2)}`;
    const signature = crypto
        .createHmac("sha256", params.secretKey)
        .update(randomString + params.uriPath + JSON.stringify(params.body))
        .digest("hex");

    const authorizationParams = [
        `apiKey:${params.apiKey}`,
        `randomKey:${randomString}`,
        `signature:${signature}`,
    ];

    const encoded = Buffer.from(authorizationParams.join("&")).toString("base64");
    return { authorization: `IYZWSv2 ${encoded}`, randomKey: randomString };
}

export function createIyzicoAdapter(cfg: SupplierPaymentConfig): PaymentProviderAdapter {
    if (!cfg.iyzico) throw new Error("IYZICO_CONFIG_INVALID");

    const baseUrl = cfg.iyzico.baseUrl.replace(/\/$/, "");

    return {
        async createIntent(input: ProviderCreateIntentInput): Promise<ProviderCreateIntentResult> {
            // CF Initialize: /payment/iyzipos/checkoutform/initialize/auth/ecom
            const uriPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
            const callbackUrl = `${input.callbackBaseUrl}/api/network/payments/callback/iyzico`;

            // Minimal CF request. Extend buyer/address fields if you want.
            const body = {
                locale: "tr",
                conversationId: input.intentId,
                price: input.amount,
                paidPrice: input.amount,
                currency: input.currency,
                basketId: input.orderId ?? input.intentId,
                paymentGroup: "PRODUCT",
                callbackUrl,
                enabledInstallments: [1], // B2B v1: keep simple
                buyer: {
                    id: input.dealerMembershipId ?? "DEALER",
                    name: (input.buyer?.name ?? "B2B").slice(0, 50),
                    surname: "Buyer",
                    gsmNumber: input.buyer?.phoneE164 ?? "+905000000000",
                    email: input.buyer?.email ?? "b2b@periodya.local",
                    identityNumber: "11111111111",
                    registrationAddress: input.buyer?.address ?? "N/A",
                    ip: "127.0.0.1",
                    city: input.buyer?.city ?? "Istanbul",
                    country: "Turkey",
                    zipCode: "00000",
                },
                shippingAddress: {
                    contactName: input.buyer?.name ?? "B2B Buyer",
                    city: input.buyer?.city ?? "Istanbul",
                    country: "Turkey",
                    address: input.buyer?.address ?? "N/A",
                    zipCode: "00000",
                },
                billingAddress: {
                    contactName: input.buyer?.name ?? "B2B Buyer",
                    city: input.buyer?.city ?? "Istanbul",
                    country: "Turkey",
                    address: input.buyer?.address ?? "N/A",
                    zipCode: "00000",
                },
                basketItems: [
                    {
                        id: input.orderId ?? input.intentId,
                        name: `Periodya ${input.scope}`,
                        category1: "B2B",
                        itemType: "PHYSICAL",
                        price: input.amount,
                    },
                ],
            };

            const { authorization } = iyzicoAuthV2({
                apiKey: cfg.iyzico.apiKey,
                secretKey: cfg.iyzico.secretKey,
                uriPath,
                body,
            });

            const res = await fetchJson<any>(`${baseUrl}${uriPath}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authorization,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) {
                throw new Error("IYZICO_INIT_FAILED");
            }

            // Expect token + paymentPageUrl (or checkoutFormContent)
            const token = res.data.token as string | undefined;
            const paymentPageUrl = (res.data.paymentPageUrl as string | undefined) ?? undefined;

            if (!token || !paymentPageUrl) {
                throw new Error("IYZICO_INIT_MISSING_TOKEN");
            }

            return {
                provider: "IYZICO",
                referenceCode: token,
                redirectUrl: paymentPageUrl,
                raw: res.data,
            };
        },

        async verifyWithCallback(input: { referenceCode: string; payload: any; intentId?: string }): Promise<ProviderVerifyResult> {
            // CF Retrieve: /payment/iyzipos/checkoutform/auth/ecom/detail
            const uriPath = "/payment/iyzipos/checkoutform/auth/ecom/detail";
            const body = {
                locale: "tr",
                conversationId: input.intentId ?? input.referenceCode,
                token: input.referenceCode,
            };

            const { authorization } = iyzicoAuthV2({
                apiKey: cfg.iyzico.apiKey,
                secretKey: cfg.iyzico.secretKey,
                uriPath,
                body,
            });

            const res = await fetchJson<any>(`${baseUrl}${uriPath}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: authorization },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) {
                return { status: "PROCESSING", raw: res.text ?? res.data };
            }

            // docs show paymentStatus: "SUCCESS" / status: "success|failure"
            const status = String(res.data.paymentStatus ?? "").toUpperCase();
            if (status === "SUCCESS") {
                return { status: "SUCCEEDED", paidAmount: String(res.data.paidPrice ?? ""), raw: res.data };
            }

            if (status === "FAILURE") {
                return { status: "FAILED", raw: res.data };
            }

            // fallback
            const top = String(res.data.status ?? "").toLowerCase();
            if (top === "failure") return { status: "FAILED", raw: res.data };

            return { status: "PROCESSING", raw: res.data };
        },

        async refund(input: ProviderRefundInput): Promise<ProviderRefundResult> {
            // NOTE: Iyzico refund typically needs paymentTransactionId(s) or paymentId.
            // We use referenceCode (token) path as placeholder; mapped from providerResult upstream.
            const uriPath = "/payment/refund";

            if (!input.referenceCode) throw new Error("IYZICO_REFUND_MISSING_REF");

            const body = {
                locale: "tr",
                conversationId: input.idempotencyKey,
                paymentTransactionId: input.referenceCode, // ⚠️ replace with actual transaction id correctly modeled
                price: input.amount,
                currency: input.currency,
                reason: input.reason ?? "B2B_REFUND",
            };

            const { authorization } = iyzicoAuthV2({
                apiKey: cfg.iyzico.apiKey,
                secretKey: cfg.iyzico.secretKey,
                uriPath,
                body,
            });

            const res = await fetchJson<any>(`${baseUrl}${uriPath}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: authorization },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) return { status: "FAILED", raw: res.text ?? res.data };

            const st = String(res.data.status ?? "").toLowerCase();
            if (st === "success") return { status: "SUCCEEDED", providerRefundId: res.data.paymentTransactionId, raw: res.data };
            if (st === "failure") return { status: "FAILED", raw: res.data };

            return { status: "PROCESSING", raw: res.data };
        }
    };
}
