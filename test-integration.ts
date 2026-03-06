import { PrismaClient } from '@prisma/client';
import { uploadToS3 } from './src/lib/s3';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        const count = await prisma.companyDocument.count();
        console.log('CompanyDocument table exists. Count:', count);
    } catch (e: any) {
        console.error('Database Error:', e.message);
    }
}

async function checkS3() {
    try {
        const dummyBuffer = Buffer.from('hello world');
        const res = await uploadToS3({
            bucket: 'private',
            key: `test/ping-${Date.now()}.txt`,
            body: dummyBuffer,
            contentType: 'text/plain',
            metadata: { test: 'true' }
        });
        console.log('S3 Upload successful:', res.key);
    } catch (e: any) {
        console.error('S3 Upload Error:', e.message);
    }
}

async function main() {
    console.log('--- Testing Database ---');
    await checkDatabase();

    console.log('\n--- Testing S3 ---');
    await checkS3();
}

main().finally(() => prisma.$disconnect());
