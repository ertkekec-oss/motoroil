
import prisma from '../src/lib/prisma';
import axios from 'axios';
import fs from 'fs';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';
    const baseUrl = 'https://apitest.nilvera.com';

    let output = "";

    try {
        const url = `${baseUrl}/einvoice/Purchase/Search/Incoming?UUID=${uuid}`;
        console.log(`Searching for UUID ${uuid}...`);
        const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
        output += `Search Result: ${JSON.stringify(r.data, null, 2)}\n`;
    } catch (e: any) {
        output += `Search Error: ${e.response?.status} - ${JSON.stringify(e.response?.data)}\n`;
    }
    fs.writeFileSync('nilvera_search_deep.txt', output);
}
main();
