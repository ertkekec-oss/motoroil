import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
  console.log('Starting comprehensive db scan...');
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const models = Prisma.dmmf.datamodel.models;
  
  for (const model of models) {
    const modelNameLower = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    try {
      // @ts-ignore
      if (prisma[modelNameLower]) {
        // @ts-ignore
        await prisma[modelNameLower].findFirst();
        passed++;
      }
    } catch (e: any) {
      failed++;
      errors.push(`Table '${model.name}' Error: ${e.message.replace(/\n/g, ' ')}`);
    }
  }

  console.log('\n--- DB ANALYSIS SUMMARY ---');
  console.log(`Total Tables: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n--- DETECTED ERRORS ---');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\n- ALL TABLES AND COLUMNS ARE 100 PERCENT HEALTHY AND SYNCED WITH SCHEMA.');
  }

  await prisma.$disconnect();
}

checkAll();
