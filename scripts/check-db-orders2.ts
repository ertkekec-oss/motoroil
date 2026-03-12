import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const orders = await prisma.$queryRaw`SELECT "orderNumber", "customerName", "totalAmount", "status", "orderDate", "createdAt", "updatedAt" FROM "orders" WHERE "orderNumber" IN ('4319156565', '4480163364')`;
    console.log(orders);
}
run();
