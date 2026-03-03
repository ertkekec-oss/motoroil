import { SupplierPaymentConfig } from "../config";
import { fetchJson, toFormUrlEncoded, stripE164Plus } from "../http";
import { PaymentProviderAdapter, ProviderCreateIntentInput, ProviderCreateIntentResult, ProviderVerifyResult, ProviderRefundInput, ProviderRefundResult } from "../types";

async function getOdealToken(cfg: Required<SupplierPaymentConfig>["odeal"]) {
    const url = `${cfg.baseUrl.replace(/\/$/, "")}/token`;

    const res = await fetchJson<any>(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: toFormUrlEncoded({
            clientId: cfg.clientId,
            clientSecret: cfg.clientSecret,
            grantType: "client_credentials",
            scope: cfg.scope,
        }),
    });

    if (!res.ok || !res.data?.accessToken) {
        throw new Error("ODEAL_TOKEN_FAILED");
    }
    return res.data.accessToken as string;
}

export function createOdealAdapter(cfg: SupplierPaymentConfig): PaymentProviderAdapter {
    if (!cfg.odeal) throw new Error("ODEAL_CONFIG_INVALID");
    const baseUrl = cfg.odeal.baseUrl.replace(/\/$/, "");

    return {
        async createIntent(input: ProviderCreateIntentInput): Promise<ProviderCreateIntentResult> {
            const token = await getOdealToken(cfg.odeal);

            // Pay-by-link: POST /vpos/pay-by-link (Bearer)
            const url = `${baseUrl}/vpos/pay-by-link`;
            const returnUrl = `${input.callbackBaseUrl}/api/network/payments/callback/odeal`;

            const body = {
                amount: input.amount,
                installment: 1,
                externalId: input.intentId, // use intentId as externalId for idempotency
                returnUrl,
                phone: stripE164Plus(input.buyer?.phoneE164),
                currency: input.currency,
                buyer: input.buyer?.name,
                buyerName: input.buyer?.name,
                buyerCity: input.buyer?.city,
                buyerMail: input.buyer?.email,
                buyerAddress: input.buyer?.address,
            };

            const res = await fetchJson<any>(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) throw new Error("ODEAL_INIT_FAILED");

            // Docs: result success + checkout3DUrl; successful payment returns id for later ops.
            const checkout3DUrl =
                res.data.checkout3DUrl ??
                res.data.result?.checkout3DUrl ??
                res.data.result?.checkoutUrl ??
                res.data.url;

            const paymentId =
                res.data.id ??
                res.data.result?.id ??
                res.data.result?.paymentId ??
                undefined;

            if (!checkout3DUrl) throw new Error("ODEAL_INIT_MISSING_URL");

            // Prefer provider id if returned; else use externalId (=intentId)
            const referenceCode = String(paymentId ?? input.intentId);

            return {
                provider: "ODEAL",
                referenceCode,
                redirectUrl: String(checkout3DUrl),
                raw: res.data,
            };
        },

        async verifyWithCallback(input: { referenceCode: string; payload: any; intentId?: string }): Promise<ProviderVerifyResult> {
            // Status check: POST /vpos/check-status with id or externalId
            const token = await getOdealToken(cfg.odeal);
            const url = `${baseUrl}/vpos/check-status`;

            const body: any = {};
            // If provider id is numeric-ish, send id; otherwise send externalId
            if (/^\d+$/.test(input.referenceCode)) body.id = input.referenceCode;
            else body.externalId = input.intentId ?? input.referenceCode;

            const res = await fetchJson<any>(url, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) return { status: "PROCESSING", raw: res.text ?? res.data };

            const ps = String(res.data.result?.payment_status ?? res.data.payment_status ?? "").toUpperCase();

            if (ps === "COMPLETED") return { status: "SUCCEEDED", raw: res.data };
            if (ps === "FAILED") return { status: "FAILED", raw: res.data };
            if (ps === "CANCELLED") return { status: "CANCELLED", raw: res.data };
            if (ps === "NOTFOUND") return { status: "FAILED", raw: res.data };

            return { status: "PROCESSING", raw: res.data };
        },

        async refund(input: ProviderRefundInput): Promise<ProviderRefundResult> {
            const token = await getOdealToken(cfg.odeal);
            const url = `${baseUrl}/vpos/refund`; // adjust if docs use different path

            const body: any = {
                // Odeal often uses payment id for refund; referenceCode should be that id.
                id: input.referenceCode,
                amount: input.amount,
                reason: input.reason ?? "B2B_REFUND",
                externalId: input.idempotencyKey,
            };

            const res = await fetchJson<any>(url, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok || !res.data) return { status: "FAILED", raw: res.text ?? res.data };

            const ps = String(res.data.result?.status ?? res.data.status ?? "").toUpperCase();
            if (ps === "SUCCESS" || ps === "COMPLETED") return { status: "SUCCEEDED", providerRefundId: res.data.result?.id, raw: res.data };
            if (ps === "FAIL" || ps === "FAILED") return { status: "FAILED", raw: res.data };

            return { status: "PROCESSING", raw: res.data };
        }
    };
}
