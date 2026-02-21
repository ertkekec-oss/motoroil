
import prisma from '../src/lib/prisma';
import axios from 'axios';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';
    const baseUrl = 'https://apitest.nilvera.com';

    const eps = [
        `/einvoice/Purchase/${uuid}/Model`,
        `/einvoice/Purchase/Model/${uuid}`,
        `/einvoice/Purchase/${uuid}/JSON`,
        `/einvoice/Purchase/${uuid}/Details`,
        `/einvoice/Purchase/${uuid}?GlobalUserType=Invoice`
    ];

    for (const ep of eps) {
        try {
            const r = await axios.get(`${baseUrl}${ep}`, { headers: { 'Authorization': 'Bearer ' + apiKey } });
            console.log(`EP: ${ep} | Status: ${r.status} | Has Lines: ${!!(r.data.InvoiceLines || r.data.Items || r.data.Lines)}`);
            if (r.data.InvoiceLines || r.data.Items) {
                console.log("KEYS:", Object.keys(r.data));
                break;
            }
        } catch (e: any) {
            console.log(`EP: ${ep} | Error: ${e.response?.status}`);
        }
    }
}
main();
