const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stocks = await prisma.stock.findMany({
    where: { branch: 'Merkez' },
    include: { product: true }
  });
  console.log(`Found ${stocks.length} Merkez stocks`);
  if (stocks.length > 0) {
    console.log(stocks[0]);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
