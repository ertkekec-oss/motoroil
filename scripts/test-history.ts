import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { tenantId: 'PLATFORM_ADMIN' } });
  if (!company) {
    console.log("No PLATFORM_ADMIN company found");
    const anyCompany = await prisma.company.findFirst();
    if (!anyCompany) return console.log("No companies found");
    console.log("Using company:", anyCompany.id);
  } else {
    console.log("Using PLATFORM_ADMIN company:", company.id);
  }
  
  const targetCompanyId = company ? company.id : await prisma.company.findFirst().then(c => c?.id);

  const orders = await prisma.order.findMany({
    where: {
      marketplace: 'POS',
      companyId: targetCompanyId
    }
  });

  const theOrders = await prisma.order.findMany({ where: { marketplace: 'POS' } });
  
  console.log("POS orders for target company:", orders.length);
  console.log("Total POS orders in DB:", theOrders.length);

  const txs = await prisma.transaction.findMany({
    where: { type: 'Sales', companyId: targetCompanyId }
  });
  console.log("Sales transactions:", txs.length);

  const kasa = await prisma.kasa.findMany({
    where: { companyId: targetCompanyId }
  });
  console.log("Kasas:", JSON.stringify(kasa, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
