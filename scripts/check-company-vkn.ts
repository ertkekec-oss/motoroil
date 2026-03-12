import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();
    companies.forEach(c => {
        console.log(`Company: ${c.name}, VKN: ${c.vkn}`);
    });
}
main();
