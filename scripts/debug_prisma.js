
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Models in Prisma:');
const keys = Object.keys(prisma);
const models = keys.filter(k => !k.startsWith('$') && !k.startsWith('_'));
console.log(models.sort().join(', '));
process.exit(0);
