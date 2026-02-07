
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const staff = await (prisma as any).staff.findMany();
    console.log('--- STAFF ---');
    console.log(JSON.stringify(staff.map((s: any) => ({ id: s.id, name: s.name, role: s.role, username: s.username })), null, 2));

    const users = await (prisma as any).user.findMany();
    console.log('--- USERS ---');
    console.log(JSON.stringify(users.map((u: any) => ({ id: u.id, name: u.name, role: u.role, tenantId: u.tenantId })), null, 2));

    const subs = await (prisma as any).subscription.findMany();
    console.log('--- SUBSCRIPTIONS ---');
    console.log(JSON.stringify(subs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
