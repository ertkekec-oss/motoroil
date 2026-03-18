import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'PERSONE DENEME' } });
    if (!user) return console.log('user not found');
    const staff = await prisma.staff.findFirst({
        where: {
            OR: [
                { email: user.email },
                { username: user.username || user.email }
            ]
        }
    });
    console.log("USER EMAIL:", user.email);
    console.log("USER USERNAME:", user.username);
    console.log("STAFF ID:", staff?.id);
    console.log("STAFF EMAIL:", staff?.email);
    console.log("STAFF USERNAME:", staff?.username);
    
    // Total targets for that staff
    if (staff) {
        const t = await prisma.staffTarget.count({ where: { staffId: staff.id }});
        console.log("TARGETS COUNT:", t);

        const v = await prisma.salesOrder.aggregate({ where: { staffId: staff.id }, _sum: { totalAmount: true }});
        console.log("FIELD SALES SUM:", v._sum.totalAmount);
        
        const o = await prisma.order.aggregate({ where: { staffId: staff.id }, _sum: { totalAmount: true }});
        console.log("STORE SALES SUM:", o._sum.totalAmount);
    }
}

main().finally(() => prisma.$disconnect());
