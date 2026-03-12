import { PrismaClient } from '@prisma/client';
import { NilveraInvoiceService } from './src/services/nilveraService';
import { decrypt } from './src/lib/encryption';

const prisma = new PrismaClient();

async function run() {
    const intSettings = await prisma.integratorSettings.findFirst({
        where: { isActive: true }
    });
    if (!intSettings || !intSettings.credentials) {
        console.log("No setting");
        return;
    }
    const creds = JSON.parse(decrypt(intSettings.credentials));
    const apiKey = creds.apiKey || creds.ApiKey;
    
    const nilvera = new NilveraInvoiceService({
        apiKey,
        baseUrl: "https://api.nilvera.com"
    });
    
    // Test checkDespatchTaxpayer
    const res = await nilvera.checkDespatchTaxpayer("6231776841");
    console.log("Despatch JSON:", JSON.stringify(res, null, 2));

    const res2 = await nilvera.checkTaxpayer("6231776841");
    console.log("E-Invoice JSON:", JSON.stringify(res2, null, 2));
}

run();
