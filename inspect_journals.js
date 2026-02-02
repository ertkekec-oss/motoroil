const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    console.log('--- ALL JOURNALS FROM TODAY ---');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const journals = await prisma.journal.findMany({
        where: { date: { gte: startOfDay } }
    });

    console.table(journals.map(j => ({
        id: j.id,
        fisNo: j.fisNo,
        sourceType: j.sourceType,
        sourceId: j.sourceId,
        desc: j.description?.substring(0, 30)
    })));
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
