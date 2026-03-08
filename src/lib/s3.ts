import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redisConnection } from "./queue/redis";

const s3Config: any = {
    region: process.env.AWS_REGION || "eu-north-1"
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID.trim() !== "") {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    };
}

if (process.env.AWS_S3_ENDPOINT) {
    s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
    s3Config.forcePathStyle = true;
}

export const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "periodya-labels";

export async function uploadLabel(
    key: string,
    body: Buffer,
    contentType: string = "application/pdf"
) {
    // Write backup to Redis (ttl 7 days) just in case S3 fails or is not configured
    try {
        await redisConnection.set(`LABEL_CACHE:${key}`, body.toString('base64'), 'EX', 604800);
    } catch (redisErr) {
        console.warn("[S3 Backup] Failed to cache label in Redis:", redisErr);
    }

    try {
        if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.trim() === "") {
            console.warn(`[S3 Upload] Skipped S3 upload for ${key} because AWS_ACCESS_KEY_ID is missing.`);
            return key;
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "private, max-age=31536000, immutable",
        });

        await s3Client.send(command);
    } catch (s3Err: any) {
        console.error(`[S3 Upload] S3 client failed, using Redis cache fallback instead. Error: ${s3Err.message}`);
    }

    return key;
}

export async function getLabelSignedUrl(key: string, expiresIn: number = 300) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getUploadPresignedUrl(key: string, contentType: string, expiresIn: number = 600) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export function generateLabelStorageKey(
    companyId: string,
    marketplace: string,
    shipmentPackageId: string
) {
    return `labels/${companyId}/${marketplace}/${shipmentPackageId}.pdf`;
}

// ------------------------------------------------------------------------------------------
// NEW MULTI-TENANT ENTERPRISE S3 HELPERS (PROD)
// ------------------------------------------------------------------------------------------

const PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET || "periodya-prod-public";
const PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || "periodya-prod-private";

export function getBucketName(bucketType: 'public' | 'private'): string {
    return bucketType === 'public' ? PUBLIC_BUCKET : PRIVATE_BUCKET;
}

export function sanitizeS3Key(key: string): string {
    let normalized = key.replace(/\\/g, '/');
    normalized = normalized.replace(/\/+/g, '/');
    normalized = normalized.replace(/^\/+/, '');

    const segments = normalized.split('/');
    const safeSegments = [];

    for (const segment of segments) {
        if (!segment) continue;
        if (segment === '.' || segment === '..') {
            throw new Error('Invalid S3 Key: directory traversal is not allowed');
        }
        if (segment.includes('\0')) {
            throw new Error('Invalid S3 Key: contains null byte');
        }
        safeSegments.push(segment.replace(/[^a-zA-Z0-9\-_=.]/g, '-'));
    }

    return safeSegments.join('/');
}

export async function uploadToS3(params: {
    bucket: 'public' | 'private';
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
}) {
    const bucketName = getBucketName(params.bucket);
    const safeKey = sanitizeS3Key(params.key);

    const defaultCache = params.bucket === 'public'
        ? 'public, max-age=31536000, immutable'
        : 'no-store';

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
        Body: params.body,
        ContentType: params.contentType,
        CacheControl: params.cacheControl || defaultCache,
        Metadata: params.metadata,
    });

    try {
        await s3Client.send(command);
        return { success: true, key: safeKey };
    } catch (e: any) {
        console.error(`[S3 Multi-Tenant Upload] Failed: ${e.message}`);
        throw new Error(`S3 Upload failed: ${e.message}`);
    }
}

export async function getSignedUploadUrl(params: {
    bucket: 'public' | 'private';
    key: string;
    contentType: string;
    expiresInSeconds?: number;
}) {
    const command = new PutObjectCommand({
        Bucket: getBucketName(params.bucket),
        Key: sanitizeS3Key(params.key),
        ContentType: params.contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds || 3600 });
}

export async function getSignedDownloadUrl(params: {
    bucket: 'public' | 'private';
    key: string;
    expiresInSeconds?: number;
    downloadFilename?: string;
    inline?: boolean;
}) {
    const options: any = {
        Bucket: getBucketName(params.bucket),
        Key: sanitizeS3Key(params.key),
    };

    if (params.downloadFilename) {
        const disposition = params.inline ? 'inline' : 'attachment';
        options.ResponseContentDisposition = `${disposition}; filename="${params.downloadFilename}"`;
    } else if (params.inline) {
        options.ResponseContentDisposition = 'inline';
    }

    if (params.inline) {
        options.ResponseContentType = 'application/pdf';
    }

    const command = new GetObjectCommand(options);
    return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds || 3600 });
}

export async function deleteFromS3(params: {
    bucket: 'public' | 'private';
    key: string;
}) {
    const command = new DeleteObjectCommand({
        Bucket: getBucketName(params.bucket),
        Key: sanitizeS3Key(params.key),
    });

    try {
        await s3Client.send(command);
        return { success: true };
    } catch (e: any) {
        console.error(`[S3 Multi-Tenant Delete] Failed: ${e.message}`);
        throw new Error(`S3 Delete failed: ${e.message}`);
    }
}

export function getPublicObjectUrl(key: string): string {
    const region = process.env.AWS_REGION || "eu-north-1";
    const safeKey = sanitizeS3Key(key);
    const encodedKey = encodeURIComponent(safeKey).replace(/%2F/g, '/');

    return `https://${PUBLIC_BUCKET}.s3.${region}.amazonaws.com/${encodedKey}`;
}
