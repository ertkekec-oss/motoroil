import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function run() {
    const vkn = '6231776841';

    let nilveraApiKey = '';
    let nilveraBaseUrl = 'https://apitest.nilvera.com';

    const settingsRecord = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    const config = (settingsRecord?.value as any) || {};
    nilveraApiKey = (config.apiKey || '').trim();

    try {
        const res = await axios.get(
            `https://apitest.nilvera.com/general/GlobalCompany/Check/TaxNumber/${vkn}?globalUserType=Despatch`,
            { headers: { 'Authorization': `Bearer ${nilveraApiKey}`, 'Content-Type': 'application/json' } }
        );
        console.log('Check Despatch:', res.status, res.data);
    } catch(e: any) {
        console.log('Check Despatch Error:', e.response?.status, JSON.stringify(e.response?.data));
    }
}
run();
