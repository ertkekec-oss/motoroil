
import prisma from '../src/lib/prisma';
import axios from 'axios';
import fs from 'fs';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const baseUrl = 'https://apitest.nilvera.com';

    let output = "";

    try {
        const url = `${baseUrl}/einvoice/Purchase/Search/Incoming?PageNumber=1&PageSize=5`;
        const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
        output += `Incoming Search Status: ${r.status}\n`;
        const items = r.data.Content || [];
        output += `Found ${items.length} items.\n`;
        if (items.length > 0) {
            output += `Item 0 Keys: ${Object.keys(items[0]).join(',')}\n`;
        }
    } catch (e: any) {
        output += `Search Error: ${e.response?.status}\n`;
    }
    fs.writeFileSync('nilvera_results_5.txt', output);
}
main();
