import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugInvoice(id: string) {
    const invoice = await (prisma as any).salesInvoice.findUnique({ where: { id } });
    if (!invoice) {
        console.log("Invoice not found in salesInvoice");
        const purchase = await (prisma as any).purchaseInvoice.findUnique({ where: { id } });
        console.log("Purchase Invoice:", JSON.stringify(purchase, null, 2));
        return;
    }
    console.log("=== INVOICE ===");
    console.log(JSON.stringify({
        id: invoice.id,
        companyId: invoice.companyId,
        formalUuid: invoice.formalUuid,
        formalType: invoice.formalType,
        isFormal: invoice.isFormal,
        formalStatus: invoice.formalStatus
    }, null, 2));

    console.log("\n=== INTEGRATOR SETTINGS (new table) ===");
    const settings = await (prisma as any).integratorSettings.findUnique({
        where: { companyId: invoice.companyId }
    });
    if (settings) {
        console.log(JSON.stringify({
            id: settings.id,
            companyId: settings.companyId,
            isActive: settings.isActive,
            environment: settings.environment,
            integratorType: settings.integratorType,
            hasCredentials: !!settings.credentials
        }, null, 2));
    } else {
        console.log("NOT FOUND in integratorSettings for companyId:", invoice.companyId);
    }

    console.log("\n=== OLD APP SETTINGS ===");
    const appSettings = await prisma.appSettings.findUnique({
        where: { companyId_key: { companyId: invoice.companyId, key: 'eFaturaSettings' } }
    });
    if (appSettings) {
        const val = appSettings.value as any;
        console.log(JSON.stringify({
            hasApiKey: !!(val?.apiKey || val?.nilvera?.apiKey),
            environment: val?.environment,
            nilvera: val?.nilvera
        }, null, 2));
    } else {
        console.log("NOT FOUND in appSettings");
    }

    console.log("\n=== ALL INTEGRATOR SETTINGS FOR COMPANY ===");
    const allSettings = await (prisma as any).integratorSettings.findMany({
        where: { companyId: invoice.companyId }
    });
    console.log("Count:", allSettings.length);
    allSettings.forEach((s: any) => {
        console.log({ id: s.id, isActive: s.isActive, environment: s.environment, type: s.integratorType });
    });
}

debugInvoice('cmlvksr4g0002gtvtj1gf0uza').then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
