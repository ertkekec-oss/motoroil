
import { repairAccounting } from './src/lib/accounting';
import { prisma } from './src/lib/prisma';

async function main() {
    try {
        console.log('Running repairAccounting...');
        const result = await repairAccounting('Merkez');
        console.log('Result:', result);
    } catch (e: any) {
        console.error('FAILED with error:');
        console.error(e);
        if (e.code === 'P2002') {
            console.error('Unique constraint failed on:', e.meta?.target);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
