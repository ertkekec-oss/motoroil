const axios = require('axios');
const prisma = require('./src/lib/prisma').prisma;

async function main() {
    const settings = await prisma.appSettings.findFirst({
        where: { key: 'erecordConfig' }
    });
    const config = settings.value;
    const apiKey = config.apiKey;
    const isTest = config.isTestEnvironment || false;
    const baseUrl = isTest ? 'https://apitest.nilvera.com' : 'https://api.nilvera.com';

    try {
        const res = await axios.post(`${baseUrl}/earchive/Invoice/Cancel`, [], {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Success:", res.data);
    } catch(e) {
        console.log("Error status:", e.response?.status);
        console.log("Error data:", e.response?.data);
    }
}
main();
