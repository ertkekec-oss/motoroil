import crypto from 'crypto';

export function computeSignalDedupeKey(input: any): string {
    const normalized = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
}
