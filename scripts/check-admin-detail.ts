import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const staff = await prisma.staff.findFirst({
        where: { OR: [{ username: 'admin' }, { email: 'admin@kech.tr' }] }
    });
    console.log('Staff Admin Detail:');
    if (staff) {
        console.log(`- ID: ${staff.id}`);
        console.log(`- Username: ${staff.username}`);
        console.log(`- Email: ${staff.email}`);
        console.log(`- Has Password: ${!!staff.password}`);
        console.log(`- Password starts with $2: ${staff.password?.startsWith('$2')}`);
        console.log(`- Password Value: ${staff.password}`); // It's a test env, seeing the value is fine to debug plain text issue
    } else {
        console.log('NOT FOUND in Staff');
    }

    const user = await prisma.user.findFirst({
        where: { email: 'admin@kech.tr' }
    });
    console.log('\nUser Admin Detail:');
    if (user) {
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Has Password: ${!!user.password}`);
    } else {
        console.log('NOT FOUND in User');
    }
}

main().finally(() => prisma.$disconnect())
