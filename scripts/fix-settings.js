const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const key = 'eFaturaSettings';
        const current = await prisma.appSettings.findUnique({ where: { key } });
        if (!current) {
            console.log("No settings to fix.");
            return;
        }

        let val = current.value;

        // BACKUP OLD VALUE
        console.log("OLD VALUE:", JSON.stringify(val));

        // FIX: Force API URL to Nilvera Test
        val.apiUrl = "https://apitest.nilvera.com";

        // Update DB
        await prisma.appSettings.update({
            where: { key },
            data: { value: val }
        });
        console.log("Settings UPDATED successfully.");
        console.log("NEW VALUE:", JSON.stringify(val, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
