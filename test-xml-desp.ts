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

    const id = "9d15453c-6482-44d8-b27a-315d594873d4"; 

    try {
        const url = `${baseUrl}/edespatch/Purchase/${id}/Xml`;
        const res = await axios.get(url, { headers });
        console.log("Got XML length:", res.data.length);

        const { XMLParser } = require('fast-xml-parser');
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            removeNSPrefix: true // remove prefix to make logging easier
        });
        const jObj = parser.parse(res.data);
        console.log("Root keys:", Object.keys(jObj));
        if (jObj.DespatchAdvice) {
            console.log("DespatchAdvice keys:", Object.keys(jObj.DespatchAdvice));
            console.log("DespatchLine keys:",  Object.keys(jObj.DespatchAdvice.DespatchLine || {}));
            console.log("SupplierParty:", jObj.DespatchAdvice.DespatchSupplierParty);
            console.log("DespatchLine:", JSON.stringify(jObj.DespatchAdvice.DespatchLine, null, 2));
        }

    } catch (err: any) {
        console.log(`Fails on : ${err.message}`);
    }
}
main();
