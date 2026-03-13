import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { NilveraInvoiceService } from './src/services/nilveraService';

async function main() {
    const prisma = new PrismaClient();
    const settingsRecord = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    const rawConfig = settingsRecord?.value as any;
    const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
    const apiKey = config?.apiKey;
    const baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

    const nilvera = new NilveraInvoiceService({ apiKey, baseUrl: baseUrl || 'https://apitest.nilvera.com' });
    
    // Correct ID this time
    const id = "9d15453c-6482-44d8-b27a-315d594873d4";
    console.log("Testing getDespatchDetails for", id);
    const result = await nilvera.getDespatchDetails(id);
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
