
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPriceLists() {
    try {
        const lists = await prisma.priceList.findMany();
        console.log('Price Lists:', lists);

        const companies = await prisma.company.findMany();
        console.log('Companies:', companies);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPriceLists();
