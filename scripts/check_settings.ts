
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.integratorSettings.findMany();
    console.log('IntegratorSettings:', JSON.stringify(settings, null, 2));

    const appSettings = await prisma.appSettings.findMany({
        where: { key: 'eFaturaSettings' }
    });
    console.log('AppSettings (eFaturaSettings):', JSON.stringify(appSettings, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
