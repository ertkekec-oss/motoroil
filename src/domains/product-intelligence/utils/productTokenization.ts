export function tokenizeProductName(input: string): string[] {
    if (!input) return [];

    const WEAK_WORDS = [
        'adet', 'urun', 'ürün', 'yag', 'yağ', 'motor', 'parca', 'parça', 'model', 'rulman', 'yedek', 'orijinal', 'orjinal', 'sanayi', 'tip', 'kalite'
    ];

    let clean = input.toLowerCase()
        .replace(/[^\w\s\d]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const tokens = clean.split(' ').filter(t => t.length > 1);

    // Remove weak words
    const filtered = tokens.filter(t => !WEAK_WORDS.includes(t));

    // Deduplicate
    return Array.from(new Set(filtered));
}

export function extractBrandToken(input: string): string | null {
    if (!input) return null;
    // Extracted from prompt or common logic. Extending basic list from prompt 1.
    const commonBrands = ['castrol', 'motul', 'mobil', 'shell', 'liquimoly', 'liqui moly', 'petronas', 'elf', 'total', 'skf', 'fag', 'timken', 'ntn', 'snr'];
    const lower = input.toLowerCase();

    for (const brand of commonBrands) {
        if (lower.includes(brand)) return brand;
    }
    return null;
}

export function extractNumericTokens(input: string): string[] {
    const matches = input.match(/\b\d+\b/g);
    return matches ? matches : [];
}

export function extractAlphaNumericSkuTokens(input: string): string[] {
    // matches words containing both letters and numbers, or patterns with dashes like 10W-40, SKF-6203
    // Simplification: just find alphanumeric tokens
    const clean = input.toUpperCase().replace(/[^\w\s\d-]/gi, ' ').split(/\s+/);
    return clean.filter(t => /[A-Z]/.test(t) && /\d/.test(t));
}
