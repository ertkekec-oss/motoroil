
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pagesCount = await (prisma as any).cmsPage.count();
    const settings = await (prisma as any).cmsGeneralSettings.findFirst();

    console.log(`Pages Count: ${pagesCount}`);
    console.log(`Settings exists: ${!!settings}`);
    if (settings) {
        console.log(`Site Title: ${settings.siteTitle}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
