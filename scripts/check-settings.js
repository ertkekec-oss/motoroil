const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const settings = await prisma.appSettings.findUnique({
            where: { key: 'eFaturaSettings' }
        });
        if (settings && settings.value) {
            // Parse if it's stored as string, otherwise just access it
            let val = settings.value;
            // Prisma stores Json type as object usually
            console.log("FULL VALUE:", JSON.stringify(val, null, 2));
        } else {
            console.log("No settings found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
