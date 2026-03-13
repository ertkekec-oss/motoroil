import axios from 'axios';
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const settingsRecord = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    const rawConfig = settingsRecord?.value as any;
    const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
    const apiKey = config?.apiKey;
    const baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/pdf'
    };

    const id = "9d15453c-6482-44d8-b27a-315d594873d4"; 

    const endpoints = [
        `${baseUrl}/edespatch/Purchase/${id}/Pdf`,
        `${baseUrl}/edespatch/Purchase/${id}/pdf`,
        `${baseUrl}/edespatch/Purchase/despatch/${id}/pdf`,
        `${baseUrl}/edespatch/Despatch/${id}/pdf`,
        `${baseUrl}/edespatch/Sale/${id}/pdf`
    ];

    for (const url of endpoints) {
        console.log("Trying", url);
        try {
            const res = await axios.get(url, { headers, responseType: 'arraybuffer', validateStatus: () => true });
            console.log(url, "=>", res.status, res.headers['content-type'], "bytes:", res.data?.length);
        } catch (e: any) {
             console.log("Error:", e.message);
        }
    }
}
main();
