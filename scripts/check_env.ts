
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const appSettings = await prisma.appSettings.findMany({
        where: { key: 'eFaturaSettings' }
    });
    appSettings.forEach(s => {
        const val = s.value as any;
        console.log(`Company ID: ${s.companyId}, Env: ${val.environment || val.nilvera?.environment || 'N/A'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
