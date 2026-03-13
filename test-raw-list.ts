import axios from 'axios';
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const settingsRecord = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    const rawConfig = settingsRecord?.value as any;
    const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});
    const apiKey = config?.apiKey;
    const baseUrl = config?.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    console.log("Fetching /edespatch/Purchase ...");
    const lsRes = await axios.get(`${baseUrl}/edespatch/Purchase?PageSize=1`, { headers });
    
    if (lsRes.data?.Content) {
        console.log("Raw content item:", lsRes.data.Content[0]);
    } else {
        console.log("No content?", lsRes.data);
    }
}
main().catch(console.error);
