const STOP_WORDS = ['motor', 'yagi', 'yağı', 'litresi', 'litre', 've', 'ile', 'icin', 'için'];

export function normalizeProductName(name: string): string {
    let normalized = name.toLowerCase();

    // Punctuation remove
    normalized = normalized.replace(/[^\w\sğüşıöç]/gi, ' ');

    // Remove stop words
    const words = normalized.split(/\s+/).filter(word => {
        return word.length > 0 && !STOP_WORDS.includes(word);
    });

    normalized = words.join(' ');

    // Trim spaces
    normalized = normalized.trim();

    return normalized;
}

export function extractBrand(name: string): string | null {
    const commonBrands = ['castrol', 'motul', 'mobil', 'shell', 'liqui moly', 'petronas', 'elf', 'total'];
    const lowerName = name.toLowerCase();
    for (const brand of commonBrands) {
        if (lowerName.includes(brand)) {
            return brand;
        }
    }
    return null;
}
