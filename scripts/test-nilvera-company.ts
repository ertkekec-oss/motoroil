import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/encryption';
import axios from 'axios';

const prisma = new PrismaClient();

async function check() {
    const settings = await prisma.integratorSettings.findFirst({
        where: { isActive: true }
    });
    if (!settings) {
        console.log("No config found");
        return;
    }
    const creds = JSON.parse(decrypt(settings.credentials));
    const token = creds.apiKey;

    console.log("Token:", token?.substring(0, 10) + "...");

    try {
        const res = await axios.get('https://apitest.nilvera.com/general/Company', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("CompanyInfo response:", JSON.stringify(res.data, null, 2));
    } catch(e: any) {
        console.log("Error:", e.response?.data || e.message);
    }
}
check();
