
import prisma from '../src/lib/prisma';
import axios from 'axios';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';
    const baseUrl = 'https://apitest.nilvera.com';

    const endpoints = [
        `/einvoice/Purchase/${uuid}/Model`,
        `/einvoice/Purchase/${uuid}/Details`,
        `/einvoice/Purchase/${uuid}/UBL`
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Trying ${ep}...`);
            const res = await axios.get(`${baseUrl}${ep}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            console.log(`Success ${ep}! Keys:`, Object.keys(res.data).slice(0, 10));
            if (res.data.Supplier) console.log("Has Supplier!");
            if (res.data.InvoiceLines) console.log("Has InvoiceLines! Count:", res.data.InvoiceLines.length);
        } catch (e: any) {
            console.log(`Failed ${ep}: ${e.response?.status} ${e.message}`);
        }
    }
}
main();
