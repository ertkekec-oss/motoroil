import { PrismaClient } from '@prisma/client';
import { getSignedDownloadUrl } from './src/lib/s3';
const prisma = new PrismaClient();

async function main() {
    const session = await prisma.signatureSession.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { envelope: true }
    });
    if (!session) return;
    const env = session.envelope;

    const signedUrl = await getSignedDownloadUrl({
        bucket: 'public', // fallback test
        key: env.documentKey,
        expiresInSeconds: 300,
        downloadFilename: env.documentFileName,
        inline: true
    });
    console.log(signedUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
