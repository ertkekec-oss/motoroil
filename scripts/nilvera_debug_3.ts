
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

    const paths = [
        `/einvoice/Purchase/Model/Incoming/${uuid}`,
        `/einvoice/Purchase/Details/Incoming/${uuid}`,
        `/einvoice/Purchase/Model/${uuid}`,
        `/einvoice/Purchase/Details/${uuid}`,
        `/einvoice/Purchase/${uuid}/Model`,
        `/einvoice/Purchase/Incoming/${uuid}`
    ];

    for (const p of paths) {
        try {
            const url = `${baseUrl}${p}`;
            const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            output += `Path: ${p} | Status: ${r.status} | DataKeys: ${Object.keys(r.data).join(',').substring(0, 100)}\n`;
            if (r.data.InvoiceLines) output += `   -> HAS LINES!\n`;
        } catch (e: any) {
            output += `Path: ${p} | Error: ${e.response?.status}\n`;
        }
    }
    fs.writeFileSync('nilvera_results_3.txt', output);
    console.log("Done");
}
main();
