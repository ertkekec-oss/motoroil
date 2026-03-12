import { PrismaClient } from '@prisma/client';
async function run() {
    const p = new PrismaClient();
    const order = await p.order.findFirst({where:{orderNumber:'4448396788'}});
    console.log(order);
    await p.$disconnect();
}
run();
