import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const allStaff = await prisma.staff.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            tenantId: true
        }
    });
    console.log('All Staff:', JSON.stringify(allStaff, null, 2));

    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            tenantId: true
        }
    });
    console.log('All Users:', JSON.stringify(allUsers, null, 2));
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
