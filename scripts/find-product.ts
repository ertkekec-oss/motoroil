import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const product = await prisma.product.findFirst({
            where: { deletedAt: null },
            select: { id: true, name: true, companyId: true, code: true }
        });

        console.log(JSON.stringify(product));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
