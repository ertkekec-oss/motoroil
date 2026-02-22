import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "eu-central-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    // If using S3 compatible storage like R2 or DigitalOcean
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "periodya-labels";

export async function uploadLabel(
    key: string,
    body: Buffer,
    contentType: string = "application/pdf"
) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "private, max-age=31536000, immutable",
    });

    await s3Client.send(command);
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
