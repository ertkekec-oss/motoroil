const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const inv = await prisma.salesInvoice.findFirst({ 
      where: { isFormal: true, formalUuid: { not: null } },
      orderBy: { createdAt: 'desc' }
  });
  console.log("INV", inv.id, inv.formalUuid, inv.companyId);
  
  const settings = await prisma.appSettings.findUnique({
    where: { companyId_key: { companyId: inv.companyId, key: 'eFaturaSettings' } }
  });
  
  const config = settings?.value || {};
  let apiKey = (config.apiKey || config.nilvera?.apiKey || '').trim();
  let env = (config.environment || config.nilvera?.environment || 'test').toLowerCase();
  
  if (!apiKey) {
      const intSettings = await prisma.integratorSettings.findFirst({
         where: { companyId: inv.companyId, isActive: true }
      });
      if (intSettings?.credentials) {
         try {
             // Mock decrypt for test script if possible, or just copy key from db manually via script. 
             // Without next.js env, encryption might fail. 
             const { decrypt } = require('./src/lib/encryption');
             const creds = JSON.parse(decrypt(intSettings.credentials));
             apiKey = creds.apiKey || creds.ApiKey;
             env = intSettings.environment.toLowerCase();
         } catch(e) { console.error("Decrypt err", e.message); }
      }
  }

  const baseUrl = env === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
  
  console.log("URL", `${baseUrl}/earchive/Invoices/${inv.formalUuid}/Cancel`);
  
  try {
    const res = await axios.put(`${baseUrl}/earchive/Invoices/${inv.formalUuid}/Cancel`, null, {
        headers: { Authorization: `Bearer ${apiKey}` },
        validateStatus: () => true
    });
    console.log("STATUS", res.status);
    console.log("DATA TYPE", typeof res.data, Array.isArray(res.data));
    console.log("DATA", JSON.stringify(res.data));
  } catch(e) {
    console.log("ERR", e.message);
  }
}
main();
