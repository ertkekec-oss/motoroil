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
        console.log("SUCCESS");
    } catch (err: any) {
        console.log("PRISMA ERROR DETAILS:");
        console.log(err.message);
    }
}
run().then(() => process.exit(0));
