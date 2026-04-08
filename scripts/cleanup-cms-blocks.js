const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
  const page = await p.cmsPageV2.findFirst({ where: { slug: 'index' } });
  if (!page) return;
  const blocks = await p.cmsBlock.findMany({ where: { pageId: page.id }, orderBy: { order: 'asc' } });
  
  const seenTypes = new Set();
  const toDelete = [];
  
  for (const b of blocks) {
     if (seenTypes.has(b.type)) {
         toDelete.push(b.id);
     } else {
         seenTypes.add(b.type);
     }
  }
  
  console.log('Duplicates found:', toDelete.length);
  if (toDelete.length > 0) {
      await p.cmsBlock.deleteMany({ where: { id: { in: toDelete } } });
      console.log('Deleted duplicates!');
  }
  await p.$disconnect();
}
clean().catch(console.error);
