
import prisma from '../src/lib/prisma';
import { NilveraInvoiceService } from '../src/services/nilveraService';
import { decrypt } from '../src/lib/encryption';

async function main() {
    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`Checking Company: ${company.name} (${company.id})`);

        let apiKey = '';
        let baseUrl = '';

        // Try IntegratorSettings
        const intSettings = await (prisma as any).integratorSettings.findFirst({
            where: { companyId: company.id, isActive: true }
        });

        if (intSettings?.credentials) {
            try {
                const creds = JSON.parse(decrypt(intSettings.credentials));
                apiKey = (creds.apiKey || creds.ApiKey || '').trim();
                baseUrl = (intSettings.environment === 'PRODUCTION')
                    ? 'https://api.nilvera.com'
                    : 'https://apitest.nilvera.com';
                console.log("Found API Key in IntegratorSettings");
            } catch (e) {
                console.warn('Failed to decrypt integratorSettings credentials');
            }
        }

        // Try legacy appSettings
        if (!apiKey) {
            const settingsRecord = await prisma.appSettings.findUnique({
                where: { companyId_key: { companyId: company.id, key: 'eFaturaSettings' } }
            });
            const raw = (settingsRecord?.value as any) || {};
            apiKey = (raw.apiKey || raw.nilvera?.apiKey || raw.ApiKey || '').trim();
            const environment = raw.environment || raw.nilvera?.environment || 'test';
            baseUrl = (environment.toLowerCase() === 'production')
                ? 'https://api.nilvera.com'
                : 'https://apitest.nilvera.com';
            if (apiKey) console.log("Found API Key in appSettings");
        }

        if (apiKey) {
            const nilvera = new NilveraInvoiceService({ apiKey, baseUrl });
            const result = await nilvera.getIncomingInvoices();
            if (result.success) {
                const content = result.data?.Content || [];
                console.log(`Company ${company.name} Incoming Invoices: ${content.length}`);
                if (content.length > 0) {
                    // console.log("First Invoice Sample:", JSON.stringify(content[0], null, 2));
                    console.log("Invoice Keys:", Object.keys(content[0]));
                    // Check specific suspect fields
                    const inv = content[0];
                    console.log("Supplier Fields:", {
                        SupplierName: inv.SupplierName,
                        SupplierTitle: inv.SupplierTitle,
                        SupplierVkn: inv.SupplierVkn,
                        SupplierTaxNumber: inv.SupplierTaxNumber,
                        SenderName: inv.SenderName,
                        SenderTitle: inv.SenderTitle
                    });
                }
            } else {
                console.error(`Nilvera Error for ${company.name}:`, result.error);
            }
        } else {
            console.log(`No API Key found for ${company.name}`);
        }
    }
}

main();
