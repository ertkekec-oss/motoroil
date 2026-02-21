
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

    const eps = [
        `/einvoice/Purchase/${uuid}/Model`,
        `/einvoice/Purchase/${uuid}`,
        `/einvoice/Purchase/${uuid}/Details`
    ];

    for (const ep of eps) {
        try {
            const url = `${baseUrl}${ep}`;
            output += `Checking ${url}...\n`;
            const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            output += `Status: ${r.status}\n`;
            output += `Keys: ${Object.keys(r.data).join(',')}\n`;
            if (r.data.Model) output += `Model Keys: ${Object.keys(r.data.Model).join(',')}\n`;
            if (r.data.EInvoice) output += `EInvoice Keys: ${Object.keys(r.data.EInvoice).join(',')}\n`;
            if (r.data.PurchaseInvoice) output += `PurchaseInvoice Keys: ${Object.keys(r.data.PurchaseInvoice).join(',')}\n`;
        } catch (e: any) {
            output += `Error ${ep}: ${e.response?.status}\n`;
        }
    }
    fs.writeFileSync('nilvera_results.txt', output);
    console.log("Done");
}
main();
