
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
        const url = `${baseUrl}/einvoice/Purchase?UUID=${uuid}`;
        const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
        output += `Content Keys: ${Object.keys(r.data.Content[0]).join(',')}\n`;
        output += `Full Data: ${JSON.stringify(r.data.Content[0], null, 2).substring(0, 2000)}\n`;
    } catch (e: any) {
        output += `Error: ${e.response?.status}\n`;
    }
    fs.writeFileSync('nilvera_search_content.txt', output);
}
main();
