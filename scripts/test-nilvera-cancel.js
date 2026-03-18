const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');

const db = new PrismaClient();

async function run() {
    try {
        const s = await db.appSettings.findFirst({ where: { key: 'eFaturaSettings' } });
        if (!s) return console.log('No settings');
        const config = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        const apiKey = config.apiKey || config.nilvera?.apiKey;
        const isProd = config.environment === 'production' || config.nilvera?.environment === 'production';
        const baseUrl = isProd ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';

        console.log('API Key length ok?', !!apiKey);
        console.log('Base URL:', baseUrl);

        const res = await axios.get(`${baseUrl}/earchive/Invoices`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            params: { limit: 10 }
        });

        console.log('Recent eArchive Invoices:');
        res.data.Content?.slice(0, 10).forEach(i => {
            console.log(`- ${i.InvoiceSerieOrNumber} | UUID: ${i.UUID} | Status: ${i.InvoiceStatus}`);
        });
        
        console.log('-----------------');
        
        try {
            const resListCanceled = await axios.get(`${baseUrl}/earchive/Invoices?Condition=CANCELED`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            console.log('Canceled List Count:', resListCanceled.data.TotalCount || 0);
        } catch(ee) {}

    } catch(e) {
        console.error(e.response ? JSON.stringify(e.response.data) : e.message);
    } finally {
        await db.$disconnect();
    }
}
run();
