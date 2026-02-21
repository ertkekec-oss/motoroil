
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
        `/einvoice/Purchase/${uuid}/Html`,
        `/einvoice/Purchase/${uuid}/Pdf`,
        `/einvoice/Purchase/${uuid}/UBL`,
        `/einvoice/Purchase/${uuid}/Model`,
        `/einvoice/Model/Purchase/${uuid}`,
        `/earchive/Purchase/${uuid}/Details`,
        `/earchive/Purchase/${uuid}`,
        `/einvoice/Purchase/Incoming/${uuid}/Details`
    ];

    for (const p of paths) {
        try {
            const url = `${baseUrl}${p}`;
            const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            output += `Path: ${p} | Status: ${r.status} | DataKeys: ${Object.keys(r.data).join(',').substring(0, 100)}\n`;
        } catch (e: any) {
            output += `Path: ${p} | Error: ${e.response?.status}\n`;
        }
    }
    fs.writeFileSync('nilvera_results_2.txt', output);
    console.log("Done");
}
main();
