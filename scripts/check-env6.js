const { PrismaClient } = require('@prisma/client');
const { getSignedDownloadUrl } = require('./src/lib/s3');
const prisma = new PrismaClient();

async function main() {
    const e = await prisma.signatureEnvelope.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { sessions: true }
    });
    const url = await getSignedDownloadUrl({
        bucket: 'private',
        key: e.documentKey,
        expiresInSeconds: 300,
        downloadFilename: e.documentFileName,
        inline: true
    });
    console.log(url);
}

main().catch(console.error).finally(() => prisma.$disconnect());
