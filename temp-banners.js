const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const banners = await prisma.networkBanner.findMany();
  console.log(JSON.stringify(banners, null, 2));
}

main().finally(() => prisma.$disconnect());
