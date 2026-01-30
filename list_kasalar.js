
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const kasalar = await prisma.kasa.findMany();
    console.log(JSON.stringify(kasalar, null, 2));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
