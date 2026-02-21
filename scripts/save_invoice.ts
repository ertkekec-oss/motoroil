
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

    const res = await axios.get(`${baseUrl}/einvoice/Purchase/${uuid}/Details`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    fs.writeFileSync('invoice_full.json', JSON.stringify(res.data, null, 2));
    console.log("File written to invoice_full.json");
}
main();
