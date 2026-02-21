
import prisma from '../src/lib/prisma';
import { NilveraInvoiceService } from '../src/services/nilveraService';

async function main() {
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';

    const allSettings = await prisma.appSettings.findMany({
        where: { key: 'eFaturaSettings' }
    });

    if (allSettings.length === 0) {
        console.error("No eFaturaSettings found in entire DB");
        return;
    }

    const settingsRecord = allSettings[0];
    const companyId = settingsRecord.companyId;
    console.log("Using companyId:", companyId);

    const raw = (settingsRecord.value as any) || {};
    const config = raw.apiKey ? raw : (raw.nilvera || {});
    const apiKey = (config.apiKey || '').trim();
    const baseUrl = (config.environment === 'production') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

    const nilvera = new NilveraInvoiceService({ apiKey, baseUrl });
    console.log(`Testing detail endpoint for UUID: ${uuid} at ${baseUrl}`);
    const result = await nilvera.getInvoiceDetails(uuid);

    if (result.success) {
        console.log("SUCCESS!");
        console.log(JSON.stringify(result.data, null, 2));
    } else {
        console.error("ERROR:", result.error);
    }
}

main();
