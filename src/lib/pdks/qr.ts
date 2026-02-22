import { createHmac, timingSafeEqual, randomBytes } from "crypto";

export interface QRPayload {
    v: number;
    tId: string; // tenantId
    sId: string; // siteId
    dId: string; // displayId
    nonce: string;
    exp: number; // epoch seconds
}

function safeEq(a: string, b: string) {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function generatePdksToken(payload: QRPayload, secret: string): string {
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    return `${payloadB64}.${sig}`;
}

export function validatePdksToken(token: string, tenantId: string, secret: string):
    | { valid: true; payload: QRPayload }
    | { valid: false; reason: string } {
    try {
        const [payloadB64, sig] = token.split(".");
        if (!payloadB64 || !sig) return { valid: false, reason: "MALFORMED" };

        const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
        if (!safeEq(sig, expectedSig)) return { valid: false, reason: "INVALID_SIG" };

        const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as QRPayload;
        if (payload.tId !== tenantId) return { valid: false, reason: "TENANT_MISMATCH" };
        if (Date.now() / 1000 > payload.exp) return { valid: false, reason: "EXPIRED" };

        return { valid: true, payload };
    } catch {
        return { valid: false, reason: "PARSE_ERROR" };
    }
}

export function newNonce(): string {
    return randomBytes(16).toString("base64url");
}
