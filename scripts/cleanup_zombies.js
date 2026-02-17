const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanZombies() {
    console.log('🔍 Searching for "Zombie" Journals (Orphaned Accounting Entries)...');

    const journals = await prisma.journal.findMany({
        where: { OR: [{ sourceType: 'Order' }, { sourceType: 'Transaction' }] }
    });

    let zombies = [];

    for (const journal of journals) {
        let exists = false;
        if (journal.sourceType === 'Order') {
            const order = await prisma.order.findUnique({ where: { id: journal.sourceId } });
            if (order) exists = true;
        } else if (journal.sourceType === 'Transaction') {
            const trx = await prisma.transaction.findUnique({ where: { id: journal.sourceId } });
            if (trx) exists = true;
        }

        if (!exists) {
            zombies.push(journal);
        }
    }

    if (zombies.length > 0) {
        console.log(`⚠️ Found ${zombies.length} Zombie Journals! Deleting...`);
        for (const z of zombies) {
            console.log(` - Deleting Journal #${z.fisNo} (Source: ${z.sourceType} #${z.sourceId})`);
            await prisma.journalItem.deleteMany({ where: { journalId: z.id } });
            await prisma.journal.delete({ where: { id: z.id } });
        }
        console.log('✅ Cleanup Complete. Mizan should be balanced now.');
    } else {
        console.log('✅ No Zombie Journals found. Data integrity is good.');
    }
}

cleanZombies()
    .catch(e => console.error("Error:", e))
    .finally(() => prisma.$disconnect());
