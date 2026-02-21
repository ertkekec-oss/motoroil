
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

    const subs = [
        'Details', 'Model', 'UBL', 'Xml', 'XML', 'ubl', 'xml', 'Json', 'JSON', 'json',
        'Details/Incoming', 'Incoming/Details', 'Incoming', 'Model/Incoming', 'Data'
    ];

    for (const sub of subs) {
        try {
            const url = `${baseUrl}/einvoice/Purchase/${uuid}/${sub}`;
            console.log(`Trying ${url}...`);
            const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            output += `Path: ${sub} | Status: ${r.status} | Length: ${JSON.stringify(r.data).length} | Keys: ${Object.keys(r.data).join(',').substring(0, 50)}\n`;
        } catch (e: any) {
            // Silence 404
        }
    }
    fs.writeFileSync('nilvera_brute_force.txt', output);
}
main();
