import crypto from 'crypto';

export function deepSort(value: any): any {
    if (value === null || value === undefined) return value;

    // Prisma Decimal
    if (value && typeof value === 'object' && typeof value.toString === 'function' && value.constructor?.name === 'Decimal') {
        return value.toString();
    }
    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) return value.map(deepSort);

    if (typeof value === 'object') {
        return Object.keys(value).sort().reduce((acc: any, k) => {
            acc[k] = deepSort(value[k]);
            return acc;
        }, {});
    }

    return value;
}

export function createCanonicalHash(payload: any): string {
    const sorted = deepSort(payload);
    const stringified = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(stringified).digest('hex');
}

export function ApiError(message: string, code: number = 400) {
    return Response.json({ ok: false, error: { message, code } }, { status: code });
}

export function ApiSuccess(data: any, code: number = 200) {
    return Response.json({ ok: true, data }, { status: code });
}
