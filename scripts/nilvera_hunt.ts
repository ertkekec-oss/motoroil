
import prisma from '../src/lib/prisma';
import axios from 'axios';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';
    const baseUrl = 'https://apitest.nilvera.com';

    // Try to get by searching
    console.log("Searching in Incoming...");
    const searchRes = await axios.get(`${baseUrl}/einvoice/Purchase/Search/Incoming?UUID=${uuid}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log("Search Result Status:", searchRes.status);
    if (searchRes.data.Content && searchRes.data.Content.length > 0) {
        console.log("Found in search! Keys:", Object.keys(searchRes.data.Content[0]));
    } else {
        console.log("Not found in search content.");
    }

    // Try to get model specifically
    const endpoints = [
        `/einvoice/Purchase/Model/${uuid}`,
        `/einvoice/Model/Purchase/${uuid}`,
        `/einvoice/Purchase/${uuid}/Html`,
        `/einvoice/Purchase/${uuid}/Pdf`
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Trying ${ep}...`);
            const res = await axios.get(`${baseUrl}${ep}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            console.log(`Success ${ep}! Keys:`, Object.keys(res.data).slice(0, 5));
        } catch (e: any) {
            console.log(`Failed ${ep}: ${e.response?.status}`);
        }
    }
}
main();
