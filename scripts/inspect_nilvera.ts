
import prisma from '../src/lib/prisma';
import { NilveraInvoiceService } from '../src/services/nilveraService';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const n = new NilveraInvoiceService({ apiKey: c.apiKey.trim(), baseUrl: 'https://apitest.nilvera.com' });
    const r = await n.getInvoiceDetails('d1230639-c887-48d9-8c55-576ad87971f0');

    // Check if it is wrapped in an array or something
    console.log("Data Type:", typeof r.data);
    if (Array.isArray(r.data)) {
        console.log("It's an array! Length:", r.data.length);
        console.log("First element keys:", Object.keys(r.data[0]));
    } else {
        console.log("Keys:", Object.keys(r.data));
        // Check for specific common Nilvera wrappers
        if (r.data.PurchaseInvoice) console.log("Has PurchaseInvoice wrapper");
        if (r.data.Model) console.log("Has Model wrapper");
    }
}
main();
