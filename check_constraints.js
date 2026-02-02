const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const constraints = await prisma.$queryRawUnsafe(`
            SELECT 
                conname as constraint_name, 
                conrelid::regclass::text as table_name, 
                confrelid::regclass::text as remote_table 
            FROM pg_constraint 
            WHERE contype = 'f'
        `);
        console.log(JSON.stringify(constraints, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
