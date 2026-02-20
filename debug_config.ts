import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.marketplaceConfig.findMany({
        where: { companyId: 'cmlsmhyap000e8fcnemogl9hn', type: 'hepsiburada' }
    });
    console.log(JSON.stringify(configs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
