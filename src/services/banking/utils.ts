import crypto from "crypto";

/**
 * Açıklamayı normalize ederek karşılaştırmalarda tutarlılık sağlar.
 */
export function normalizeDesc(desc?: string) {
    return (desc ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\p{L}\p{N}\s]/gu, "") // Sadece harf, rakam ve boşluk kalsın
        .trim();
}

/**
 * Banka hareketi için benzersiz bir fingerprint üretir.
 * Idempotency (tekillik) sağlar, mükerrer kaydı engeller.
 */
export function generateTransactionFingerprint(input: {
    iban: string;
    direction: "IN" | "OUT";
    amount: string;        // Decimal string (ör: "1540.50")
    currency: string;
    bookingDate: string;   // YYYY-MM-DD
    valueDate?: string;    // YYYY-MM-DD
    bankRef?: string;
    description?: string;
}) {
    const base = [
        input.iban,
        input.direction,
        input.amount,
        input.currency,
        input.bookingDate,
        input.valueDate ?? "",
        input.bankRef ?? "",
        normalizeDesc(input.description),
    ].join("|");

    return crypto.createHash("sha256").update(base).digest("hex");
}
