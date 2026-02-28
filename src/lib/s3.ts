import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redisConnection } from "./queue/redis";

const s3Config: any = {
    region: process.env.AWS_REGION || "eu-central-1"
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

const s3Client = new S3Client(s3Config);

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
