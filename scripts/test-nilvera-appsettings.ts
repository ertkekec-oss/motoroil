import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function check() {
    const appSettings = await prisma.appSettings.findFirst({
        where: { key: 'eFaturaSettings' }
    });
    if (!appSettings) {
        console.log("No config found");
        return;
    }
    const creds = appSettings.value as any;
    const token = creds.apiKey;

    console.log("Token:", token?.substring(0, 10) + "...");

    try {
        const res = await axios.get('https://api.nilvera.com/general/Company', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("CompanyInfo response:", JSON.stringify(res.data, null, 2));
    } catch(e: any) {
        console.log("Error:", e.response?.data || e.message);
    }
    
    try {
        const res = await axios.get('https://apitest.nilvera.com/general/Company', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("CompanyInfo (TEST) response:", JSON.stringify(res.data, null, 2));
    } catch(e: any) {
        console.log("Error (TEST):", e.response?.data || e.message);
    }
}
check();
