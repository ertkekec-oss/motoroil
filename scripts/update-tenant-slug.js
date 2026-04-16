const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' }
    });
    
    if (tenant) {
        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { tenantSlug: 'motoroil' }
        });
        console.log(`Successfully updated first tenant (${tenant.name}) to have tenantSlug: 'motoroil'`);
    } else {
        console.log("No tenants found in the database.");
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
