import crypto from "crypto";

export function hmacSha256Hex(secret: string, data: string) {
    return crypto.createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

export function safeEqual(a: string, b: string) {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}
