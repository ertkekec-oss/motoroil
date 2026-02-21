import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
    const settings = await p.appSettings.findMany({
        where: { key: 'eFaturaSettings' }
    });

    for (const s of settings) {
        const val = s.value as any;
        console.log('companyId:', s.companyId);
        console.log('companyVkn:', val?.companyVkn);
        console.log('companyTitle:', val?.companyTitle);
        console.log('apiKey (first 15):', val?.apiKey?.substring(0, 15));
        console.log('environment:', val?.environment);
        console.log('---');
    }
}

main().catch(console.error).finally(() => p.$disconnect());
