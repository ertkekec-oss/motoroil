const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();

  for (const company of companies) {
    const companyId = company.id;
    console.log(`Processing company: ${company.name} (${companyId})`);

    const branches = await prisma.branch.findMany({
      where: { companyId }
    });

    if (branches.length === 0) {
      console.log(`No actual branches configured for company ${company.name}.`);
      continue;
    }

    const targetBranchName = branches[0].name; // usually KAYSERİ
    console.log(`Targeting existing branch: ${targetBranchName}`);

    const merkezStocks = await prisma.stock.findMany({
      where: { product: { companyId }, branch: 'Merkez' }
    });

    console.log(`Found ${merkezStocks.length} stock entries in Merkez for company ${company.name}.`);

    let mergedCount = 0;
    for (const ms of merkezStocks) {
      const existing = await prisma.stock.findFirst({
        where: { productId: ms.productId, branch: targetBranchName }
      });

      if (existing) {
        await prisma.stock.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + ms.quantity }
        });
        await prisma.stock.delete({ where: { id: ms.id } });
      } else {
        await prisma.stock.update({
          where: { id: ms.id },
          data: { branch: targetBranchName }
        });
      }
      mergedCount++;
    }

    console.log(`Merged ${mergedCount} stocks from Merkez to ${targetBranchName}.`);

    try {
      const updatedOrders = await prisma.order.updateMany({
        where: { companyId, branch: 'Merkez' },
        data: { branch: targetBranchName }
      });
      console.log(`Updated ${updatedOrders.count} orders.`);
    } catch (e) {}

    try {
      const updatedWayslips = await prisma.waySlip.updateMany({
        where: { companyId, branch: 'Merkez' },
        data: { branch: targetBranchName }
      });
      console.log(`Updated ${updatedWayslips.count} wayslips.`);
    } catch (e) {}

    try {
      const updatedInvoices = await prisma.invoice.updateMany({
        where: { companyId, branch: 'Merkez' },
        data: { branch: targetBranchName }
      });
      console.log(`Updated ${updatedInvoices.count} invoices.`);
    } catch (e) {}

    try {
      const updatedMoves = await prisma.stockMovement.updateMany({
        where: { companyId, branch: 'Merkez' },
        data: { branch: targetBranchName }
      });
      console.log(`Updated ${updatedMoves.count} stock movements.`);
    } catch (e) {}
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
