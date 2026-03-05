import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Use environment variables for configuration
const isR2 = process.env.STORAGE_PROVIDER === "r2";
const endpoint = process.env.STORAGE_ENDPOINT || undefined;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || "";
const bucket = process.env.STORAGE_BUCKET || "";
const region = process.env.STORAGE_REGION || "auto";

const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    // R2-specific settings
    ...(isR2 && {
        forcePathStyle: true,
    }),
});

export const getPublicBaseUrl = () => {
    return process.env.STORAGE_PUBLIC_BASE_URL || "";
};

export async function putObject(key: string, buffer: Buffer, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);
    return key;
}

export async function getObject(key: string) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body; // Node.js Readable stream or Blob depending on runtime
}

export async function headObject(key: string) {
    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const response = await s3Client.send(command);
    return response;
}

export async function generatePresignedGetUrl(key: string, expiresInSeconds: number = 3600) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function generatePresignedPutUrl(key: string, expiresInSeconds: number = 3600, contentType: string = 'application/pdf') {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
