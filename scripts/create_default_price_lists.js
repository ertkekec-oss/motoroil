
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const companies = await prisma.company.findMany();

        for (const company of companies) {
            console.log(`Processing company: ${company.name}`);

            // Check if there are any price lists
            const existing = await prisma.priceList.count({ where: { companyId: company.id } });
            if (existing > 0) {
                console.log(`Company ${company.name} already has price lists.`);
                continue;
            }

            // Create Default Price Lists
            await prisma.priceList.createMany({
                data: [
                    {
                        companyId: company.id,
                        name: 'Perakende',
                        currency: 'TRY',
                        isDefault: true
                    },
                    {
                        companyId: company.id,
                        name: 'Toptan',
                        currency: 'TRY',
                        isDefault: false
                    },
                    {
                        companyId: company.id,
                        name: 'Trendyol',
                        currency: 'TRY',
                        isDefault: false
                    }
                ]
            });
            console.log(`Created price lists for ${company.name}`);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
