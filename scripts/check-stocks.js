const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stocks = await prisma.stock.findMany();
  const branches = {};
  stocks.forEach(s => {
    branches[s.branch] = (branches[s.branch] || 0) + 1;
  });
  console.dir(branches, { colors: false, depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
