import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staffName = 'ertuğrul kekeç';
    const staff = await prisma.staff.findFirst({
        where: { name: { contains: staffName, mode: 'insensitive' } }
    });

    if (!staff) {
        console.log('Staff not found');
        return;
    }

    console.log(`Updating permissions for ${staff.name} (ID: ${staff.id})`);
    console.log(`Old permissions: ${JSON.stringify(staff.permissions)}`);

    const newPerms = ['pos_access', 'sales_archive'];

    // Simulate the PUT request logic
    const updated = await prisma.staff.update({
        where: { id: staff.id },
        data: { permissions: newPerms }
    });

    console.log(`New permissions in DB: ${JSON.stringify(updated.permissions)}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
