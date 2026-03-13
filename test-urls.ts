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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const id = "9d15453c-6482-44d8-b27a-315d594873d4"; // Using the actual ID from the network response

    const urlsToTest = [
        `${baseUrl}/edespatch/Purchase/${id}/Model`,
        `${baseUrl}/edespatch/Purchase/${id}/Details`,
        `${baseUrl}/edespatch/Purchase/${id}`,
        `${baseUrl}/edespatch/Purchase/${id}/Xml`
    ];

    for (const url of urlsToTest) {
        try {
            console.log(`Testing ${url}...`);
            const res = await axios.get(url, { headers });
            console.log(`SUCCESS on ${url}`);
            if (url.endsWith('/Xml') || (typeof res.data === 'string' && res.data.includes('<?xml'))) {
                console.log("got XML!");
            } else {
                console.log("got JSON!");
            }
        } catch (err: any) {
            console.log(`Fails on ${url}: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        }
    }
}
main();
