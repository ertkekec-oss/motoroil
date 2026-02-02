const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const accounts = await prisma.account.count();
    const staff = await prisma.staff.count();
    const kasalar = await prisma.kasa.count();
    const customers = await prisma.customer.count();
    const branches = await prisma.branch.count();

    console.log('📊 Database Status:');
    console.log(`   Accounts: ${accounts}`);
    console.log(`   Staff: ${staff}`);
    console.log(`   Kasalar: ${kasalar}`);
    console.log(`   Customers: ${customers}`);
    console.log(`   Branches: ${branches}`);

    await prisma.$disconnect();
}

checkData();
