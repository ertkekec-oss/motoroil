
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption.js'; // Note schema .js for tsx sometimes, or .ts? tsx handles .ts imports usually. 

const prisma = new PrismaClient();

async function main() {
    console.log('Starting SaaS Backfill...');

    // 1. Create Default Tenant
    let tenant = await prisma.tenant.findFirst({ where: { name: 'Default Tenant' } });
    if (!tenant) {
        console.log('Creating Default Tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Default Tenant',
                ownerEmail: 'admin@periodya.com',
                status: 'ACTIVE'
            }
        });
    }
    console.log('Tenant ID:', tenant.id);

    // 2. Create Default Plan
    let plan = await prisma.plan.findFirst({ where: { name: 'Standard Plan' } });
    if (!plan) {
        console.log('Creating Standard Plan...');
        plan = await prisma.plan.create({
            data: {
                name: 'Standard Plan',
                isActive: true
            }
        });
    }
    console.log('Plan ID:', plan.id);

    // 3. Create Subscription
    const sub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
    if (!sub) {
        console.log('Creating Subscription...');
        await prisma.subscription.create({
            data: {
                tenantId: tenant.id,
                planId: plan.id,
                status: 'ACTIVE',
                period: 'YEARLY',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        });
    }

    // 4. Update Companies
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        let needsUpdate = false;
        if (!company.tenantId) {
            await prisma.company.update({
                where: { id: company.id },
                data: { tenantId: tenant.id }
            });
            console.log('Updated tenantId.');
        }

        // 5. Integrator Settings
        // Check if settings exist
        const settings = await prisma.integratorSettings.findUnique({ where: { companyId: company.id } });
        if (!settings) {
            // Try to find credentials in AppSettings or Env
            let apiKey = process.env.NILVERA_API_KEY;
            let apiUrl = process.env.NILVERA_API_URL || 'https://apitest.nilvera.com'; // Default to test if missing

            // Check AppSettings
            try {
                const appSettings = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
                if (appSettings && appSettings.value) {
                    const val = appSettings.value as any;
                    if (val.apiKey) apiKey = val.apiKey;
                    if (val.apiUrl) apiUrl = val.apiUrl;
                }
            } catch (err) {
                console.log('No AppSettings table or error reading it.');
            }

            if (apiKey) {
                console.log('Found Nilvera credentials, creating IntegratorSettings...');
                const credentialsObj = {
                    apiKey: apiKey,
                    baseUrl: apiUrl
                };

                await prisma.integratorSettings.create({
                    data: {
                        companyId: company.id,
                        provider: 'NILVERA',
                        credentials: encrypt(JSON.stringify(credentialsObj)),
                        isActive: true,
                        environment: apiUrl.includes('test') ? 'TEST' : 'PRODUCTION'
                    }
                });
            } else {
                console.log('No Nilvera credentials found for this company.');
            }
        }
    }

    console.log('Backfill complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
