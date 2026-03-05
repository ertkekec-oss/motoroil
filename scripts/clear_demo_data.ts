import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching table list from database...');

    // Get all tables in the current schema (public)
    const tables: Array<{ tablename: string }> = await prisma.$queryRaw`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public';
    `;

    const allTableNames = tables.map(t => t.tablename);

    const tablesToKeep = [
        'Tenant',
        'Company',
        'IntegratorSettings',
        'Plan',
        'Feature',
        'PlanFeature',
        'PlanLimit',
        'Subscription',
        'SubscriptionHistory',
        'User',
        'UserCompanyAccess',
        'LoginAttempt',
        'Branch',
        'Staff',
        'AppSettings',
        'HelpCategory',
        'HelpTopic',
        'CmsPage',
        'CmsSection',
        'CmsMenu',
        'CmsGeneralSettings',
        'FeatureFlag',
        'TenantFeatureFlag',
        'TenantRolloutPolicy',
        'TenantPortalConfig',
        'DealerNetworkSettings',
        'GlobalProduct',
        'GlobalCategory',
        'CategoryAttribute',
        'AttributeOption',
        '_prisma_migrations', // MUST KEEP!
    ];

    const tablesToTruncate = allTableNames.filter(m => !tablesToKeep.includes(m) && !m.startsWith('_'));

    console.log(`Found ${tablesToTruncate.length} tables to truncate...`);

    const formattedTableNames = tablesToTruncate.map(m => `"${m}"`).join(', ');

    if (!formattedTableNames) {
        console.log('No tables to truncate.');
        return;
    }

    try {
        console.log(`Executing TRUNCATE TABLE ${tablesToTruncate.slice(0, 3).join(', ')} ... CASCADE;`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${formattedTableNames} CASCADE;`);
        console.log('Successfully cleared all transactional/demo data!');

        // Restore default Kasalar just in case
        const companies = await prisma.company.findMany();
        let kasaCount = 0;
        for (const c of companies) {
            const kasas = await prisma.kasa.count({ where: { companyId: c.id } });
            if (kasas === 0) {
                await prisma.kasa.createMany({
                    data: [
                        { name: 'Merkez Kasa (Nakit)', currency: 'TRY', balance: 0, branch: 'Merkez', companyId: c.id },
                        { name: 'Kredi Kartı (POS)', currency: 'TRY', balance: 0, branch: 'Merkez', companyId: c.id },
                        { name: 'Havale / EFT', currency: 'TRY', balance: 0, branch: 'Merkez', companyId: c.id }
                    ]
                });
                kasaCount += 3;
            }
        }
        console.log(`Restored ${kasaCount} default kasalar.`);

    } catch (e) {
        console.error('Failed to truncate tables:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
