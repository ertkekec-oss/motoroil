require('dotenv').config();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'eu-north-1' });

async function main() {
    const res = await s3.send(new GetObjectCommand({
        Bucket: 'per-core-storage',
        Key: 'a'
    })).catch(e => console.log("Can't find key 'a', using fallback bucket..."));
}

main();
