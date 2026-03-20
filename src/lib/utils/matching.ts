export function normalizeString(str: string): string {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
}

export function tokenizeString(str: string): string[] {
    return normalizeString(str).split(" ").filter(w => w.length > 2);
}

export function jaccardSimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    const intersection = arr1.filter(v => arr2.includes(v));
    const union = Array.from(new Set([...arr1, ...arr2]));
    return intersection.length / union.length;
}
