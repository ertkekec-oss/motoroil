const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Company Table ---');
    try {
        const companies = await prisma.company.findMany();
        let updatedCount = 0;

        for (const company of companies) {
            let needsUpdate = false;
            const data = {};

            if (company.email && company.email.includes('kech.tr')) {
                data.email = company.email.replace(/kech\.tr/g, 'periodya.com');
                needsUpdate = true;
            }

            if (company.website && company.website.includes('kech.tr')) {
                data.website = company.website.replace(/kech\.tr/g, 'periodya.com');
                needsUpdate = true;
            }

            if (company.name && company.name === 'MOTOROIL') {
                data.name = 'PERIODYA';
                needsUpdate = true;
            }

            if (needsUpdate) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: data
                });
                console.log(` ✅ Updated company ${company.id}: ${JSON.stringify(data)}`);
                updatedCount++;
            }
        }
        console.log(`Total companies updated: ${updatedCount}`);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main().finally(() => prisma.$disconnect());
