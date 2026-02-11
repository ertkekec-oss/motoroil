// src/services/banking/mock-dataset.ts

export type RawBankTx = {
    iban: string;
    direction: "IN" | "OUT";
    amount: string;
    currency: "TRY" | "USD" | "EUR";
    bookingDate: string; // YYYY-MM-DD
    valueDate?: string;
    bankRef?: string;
    description?: string;
    source: { bankId: string; method: string; fileId?: string };
};

export const GOLDEN_MOCK_DATASET: RawBankTx[] = [
    // 1. TRENDYOL PAYOUT (FULL MATCH TEST)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1540.50",
        currency: "TRY",
        bookingDate: "2026-02-12",
        bankRef: "TRN-998877",
        description: "TRENDYOL HAKEDIS ODEMESI 2026/FEB/12",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 2. DUPLICATE OF #1 (IDEMPOTENCY TEST)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1540.50",
        currency: "TRY",
        bookingDate: "2026-02-12",
        bankRef: "TRN-998877",
        description: "TRENDYOL HAKEDIS ODEMESI 2026/FEB/12",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 3. DIRTY DESCRIPTION (NORMALIZATION TEST)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1540.50",
        currency: "TRY",
        bookingDate: "2026-02-12",
        bankRef: "TRN-998877-DIRTY",
        description: ">>> TRENDYOL!! HAKEDIS... ODEMESI (2026-FEB-12) ***",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 4. EFT FROM CUSTOMER (MATCHING TEST - MEDIUM)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "5000.00",
        currency: "TRY",
        bookingDate: "2026-02-11",
        bankRef: "EFT-123",
        description: "EFT: ALI VELI - SIPARIS#4455",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 5. RENT PAYMENT (AUTOMATION TEST - CATEGORY)
    {
        iban: "TR112233445566778899001122",
        direction: "OUT",
        amount: "25000.00",
        currency: "TRY",
        bookingDate: "2026-02-01",
        bankRef: "KRA-2026-02",
        description: "SUBAT 2026 KIRA ODEMESI - MERKEZ OFIS",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 6. TAX PAYMENT (UNKNOWN CATEGORY)
    {
        iban: "TR112233445566778899001122",
        direction: "OUT",
        amount: "4250.75",
        currency: "TRY",
        bookingDate: "2026-02-10",
        bankRef: "VD-9922",
        description: "KDV ODEMESI - OCAK 2026",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 7. TOLERANCE TEST (±1 TL)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1540.00", // 0.50 diff from #1
        currency: "TRY",
        bookingDate: "2026-02-13",
        bankRef: "TRN-DIFF-1",
        description: "TRENDYOL HAKEDIS (ADJUSTMENT TEST)",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 8. MISSING BANK REF (FINGERPRINT ONLY TEST)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1200.00",
        currency: "TRY",
        bookingDate: "2026-02-14",
        description: "REF-SIZ ISLEM TESTI",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    },
    // 9. DUPLICATE OF #8 (MISSING REF IDEMPOTENCY)
    {
        iban: "TR112233445566778899001122",
        direction: "IN",
        amount: "1200.00",
        currency: "TRY",
        bookingDate: "2026-02-14",
        description: "REF-SIZ ISLEM TESTI",
        source: { bankId: "AKBANK", method: "PULL_HTTP" }
    }
];
