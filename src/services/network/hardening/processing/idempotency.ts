import crypto from 'crypto';

export function buildIdempotencyKey(processorType: string, entityId: string, additionalInput: any): string {
    const data = JSON.stringify(additionalInput || {});
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `${processorType}:${entityId}:${hash}`;
}
