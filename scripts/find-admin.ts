import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { contains: 'admin' } }
    });
    console.log('User found with "admin" in email:', JSON.stringify(user, null, 2));

    const staff = await prisma.staff.findFirst({
        where: { OR: [{ email: { contains: 'admin' } }, { username: { contains: 'admin' } }] }
    });
    console.log('Staff found with "admin" in email/username:', JSON.stringify(staff, null, 2));
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
