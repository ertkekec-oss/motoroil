import { prisma } from '../src/lib/prisma';
async function main() {
    const o = await prisma.networkOrder.findFirst({ where: { status: 'PENDING_PAYMENT' } });
    console.log(o ? o.id : 'NONE');
}
main().finally(() => process.exit(0));
