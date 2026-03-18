const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function killLocks() {
  try {
    console.log('Querying active locks...');
    // We get the raw rows
    const locks = await prisma.$queryRawUnsafe("SELECT pid, state, wait_event_type, wait_event, query FROM pg_stat_activity WHERE state = 'idle in transaction' OR wait_event_type = 'Lock';");
    console.log('Locks found:', locks);

    for (const lock of locks) {
      console.log('Killing PID:', lock.pid);
      await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(${lock.pid});`);
    }
    console.log('Done killing locks.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

killLocks();
