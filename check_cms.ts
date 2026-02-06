
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CMS PAGES ---');
    const pages = await (prisma as any).cmsPage.findMany();
    console.log(JSON.stringify(pages, null, 2));

    console.log('--- CMS SETTINGS ---');
    const settings = await (prisma as any).cmsGeneralSettings.findFirst();
    console.log(JSON.stringify(settings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
