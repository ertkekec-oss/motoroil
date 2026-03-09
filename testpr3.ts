import { prisma } from './src/lib/prisma';
import fs from 'fs';
async function run() {
    try {
        const e = await prisma.signatureEnvelope.findUnique({
            where: { id: 'cmmihh47f00063u5mbrfu1acb' },
            include: {
                recipients: {
                    orderBy: { orderIndex: 'asc' }
                },
                company: true
            }
        });
        console.log("SUCCESS");
    } catch (err: any) {
        fs.writeFileSync('pr-err.txt', err.message);
    }
}
run().then(() => process.exit(0));
