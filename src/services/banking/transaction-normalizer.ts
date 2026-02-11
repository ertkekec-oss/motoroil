export interface TransactionTags {
    type: 'MARKETPLACE' | 'INVOICE_PAYMENT' | 'EXPENSE' | 'UNKNOWN';
    entityName?: string;
    reference?: string;
    subType?: string;
}

export class TransactionNormalizer {
    /**
     * Parses unstructured bank descriptions into structured tags.
     * Uses regex patterns (potential for LLM integration here).
     */
    static parse(description: string): TransactionTags {
        const desc = description.toUpperCase();

        // 1. Marketplace Detection
        if (desc.includes('TRENDYOL')) {
            return { type: 'MARKETPLACE', entityName: 'Trendyol', subType: 'SETTLEMENT' };
        }
        if (desc.includes('HEPSIBURADA') || desc.includes('D-MARKET')) {
            return { type: 'MARKETPLACE', entityName: 'Hepsiburada', subType: 'SETTLEMENT' };
        }
        if (desc.includes('IYZICO')) {
            return { type: 'MARKETPLACE', entityName: 'Iyzico', subType: 'PSP_PAYOUT' };
        }

        // 2. Expense Detection
        if (desc.includes('KIRA') || desc.includes('RENT')) {
            return { type: 'EXPENSE', entityName: 'Office Rent', subType: 'RENT' };
        }
        if (desc.includes('ELEKTRIK') || desc.includes('SU') || desc.includes('DOGALGAZ')) {
            return { type: 'EXPENSE', entityName: 'Utility', subType: 'UTILITY' };
        }

        // 3. Customer/Invoice Payment Detection
        const invoiceMatch = desc.match(/(?:FT|INV|FATURA|SIPARIS|ID)[:#\s]*([A-Z0-9-]+)/);
        if (invoiceMatch) {
            return {
                type: 'INVOICE_PAYMENT',
                reference: invoiceMatch[1],
                subType: 'COLLECTION'
            };
        }

        return { type: 'UNKNOWN' };
    }
}
