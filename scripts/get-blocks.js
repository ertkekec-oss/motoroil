const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const blocks = await p.cmsBlock.findMany({ include: { page: true } });
  const mapped = blocks.map(x => ({ id: x.id, type: x.type, pageSlug: x.page.slug }));
  fs.writeFileSync('blocks.json', JSON.stringify(mapped, null, 2), 'utf8');
  await p.$disconnect();
}
main();
