const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const db = new PrismaClient();

async function run() {
    try {
        const s = await db.appSettings.findFirst({ where: { key: 'eFaturaSettings' } });
        const config = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        const apiKey = config.apiKey || config.nilvera?.apiKey;
        const baseUrl = 'https://apitest.nilvera.com';

        const tUuid = "ab15942f-d472-46ac-9529-61ad9661ee7a"; 
        
        console.log('Sending Cancellation for', tUuid);
        
        const req = await axios.put(`${baseUrl}/earchive/Invoices/${tUuid}/Cancel`, {
            Notes: ["İptal Testi"] // or Note, or array
        }, {
            headers: { Authorization: `Bearer ${apiKey}` },
            validateStatus: () => true
        });

        console.log('Status', req.status);
        console.log('Data', req.data);
    } catch(e) {
        console.error(e.message);
    } finally {
        await db.$disconnect();
    }
}
run();
