
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPriceListCount() {
    const total = await prisma.priceList.count();
    console.log(`Total Price Lists: ${total}`);
    const lists = await prisma.priceList.findMany({ select: { name: true, companyId: true } });
    console.log(JSON.stringify(lists, null, 2));
}

checkPriceListCount()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
