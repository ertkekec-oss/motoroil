import { prisma } from './src/lib/prisma';
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
        console.log(JSON.stringify(e, null, 2));
    } catch (err) {
        console.error("PRISMA ERROR", err);
    }
}
run().then(() => process.exit(0));
