const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
    const staff = await prisma.staff.findUnique({
        where: { username: 'admin' }
    });

    if (!staff) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log('✅ Admin user found:');
    console.log('Username:', staff.username);
    console.log('Email:', staff.email);
    console.log('Role:', staff.role);
    console.log('Branch:', staff.branch);
    console.log('Status:', staff.status);
    console.log('Password hash:', staff.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, staff.password);

    console.log('\n🔐 Password test:');
    console.log('Testing password:', testPassword);
    console.log('Match:', isMatch ? '✅ CORRECT' : '❌ WRONG');

    await prisma.$disconnect();
}

testLogin().catch(console.error);
