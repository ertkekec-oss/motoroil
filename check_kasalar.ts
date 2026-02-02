
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const allKasalar = await prisma.kasa.findMany({
        where: {
            name: {
                contains: 'ANTALYA',
                mode: 'insensitive'
            }
        }
    });
    console.log(JSON.stringify(allKasalar, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
