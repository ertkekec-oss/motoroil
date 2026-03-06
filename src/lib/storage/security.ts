import { NextResponse } from 'next/server';

/**
 * Validates and sanitizes a path input parameter (e.g. tenantId, companyId, reportType)
 * to prevent directory traversal or injection attacks in S3 keys.
 */
export function sanitizePathInput(input: string | undefined | null): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed || trimmed.includes('..') || /[^a-zA-Z0-9\-_]/.test(trimmed)) return null;
    return trimmed;
}

/**
 * Standardized error response for storage/api routes.
 */
export function storageError(message: string, status: number = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Asserts valid file format and size. Max size is in MB.
 */
export function validateStorageFile(file: File, allowedMimeTypes: string[], maxSizeMB: number) {
    if (!allowedMimeTypes.includes(file.type)) {
        return `Desteklenmeyen dosya formatı. Desteklenenler: ${allowedMimeTypes.join(', ')}`;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
        return `Dosya boyutu ${maxSizeMB}MB'ı aşamaz.`;
    }

    return null;
}
