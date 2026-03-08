const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.appSettings.findMany({ where: { key: 'smtp_settings' } });
    fs.writeFileSync('smtp_db_settings.json', JSON.stringify(settings, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());
