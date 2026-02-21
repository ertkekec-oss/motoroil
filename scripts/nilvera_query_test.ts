
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

    const queries = [
        '?includeLines=true',
        '?includeModel=true',
        '?IncludeModel=true',
        '?includeUbl=true',
        '?IncludeUBL=true',
        '?includeUBL=true'
    ];

    let output = "";
    for (const q of queries) {
        try {
            const url = `${baseUrl}/einvoice/Purchase/${uuid}/Details${q}`;
            const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            output += `Query: ${q} | Status: ${r.status} | HasLines: ${!!(r.data.InvoiceLines || r.data.Model?.InvoiceLines)}\n`;
        } catch (e: any) {
            output += `Query: ${q} | Error: ${e.response?.status}\n`;
        }
    }
    fs.writeFileSync('nilvera_query_test.txt', output);
}
main();
