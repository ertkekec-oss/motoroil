import axios from 'axios';
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
// "6cdb9bd0-ea19-482f-b4de-162e7aa24a2a"

    const settingsRecord = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    const rawConfig = settingsRecord?.value as any;
    const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
    const apiKey = config?.apiKey;
    const baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

    console.log("baseUrl", baseUrl, "apiKey length", apiKey?.length);
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    console.log("Fetching /edespatch/Purchase ...");
    const lsRes = await axios.get(`${baseUrl}/edespatch/Purchase?PageSize=5`, { headers });
    
    if (lsRes.data?.Content) {
        console.log("Content items:", lsRes.data.Content.map((c:any) => ({ id: c.UUID || c.Id, number: c.DespatchNumber || c.InvoiceNumber, t: c.Type })));
    } else {
        console.log("No content?", lsRes.data);
    }

    const id = "9d15d52c-6482-44db-b27a-335d584373d4";
    const urlsToTest = [
        `${baseUrl}/edespatch/Purchase/${id}/Model`,
        `${baseUrl}/edespatch/Purchase/${id}/Html`,
        `${baseUrl}/edespatch/Purchase/${id}`,
        `${baseUrl}/edespatch/Purchase/${id}/Xml`,
        `${baseUrl}/edespatch/Purchase/despatch/${id}`,
        `${baseUrl}/edespatch/Purchase/View/${id}`,
        `${baseUrl}/edespatch/Sale/${id}/Model`,
        `${baseUrl}/edespatch/Sale/${id}`,
        `${baseUrl}/edespatch/${id}`
    ];

    for (const url of urlsToTest) {
        try {
            console.log(`Testing ${url}...`);
            const res = await axios.get(url, { headers });
            console.log(`SUCCESS on ${url}`);
            
            // if XML, try to parse
            if (url.endsWith('/Xml') || (typeof res.data === 'string' && res.data.includes('<?xml'))) {
                console.log("got XML!");
                // console.log(res.data);
            } else {
                console.log("got JSON!", typeof res.data === 'object' ? Object.keys(res.data) : typeof res.data);
            }
        } catch (err: any) {
            console.log(`Fails on ${url}: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        }
    }
}

main().catch(console.error);
