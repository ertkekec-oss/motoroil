
import { prisma } from '../src/lib/prisma';

async function check() {
    console.log('Checking extended prisma client...');
    try {
        if (!prisma) {
            console.error('Prisma is undefined!');
            process.exit(1);
        }
        if (!prisma.company) {
            console.error('Prisma.company is undefined!');
            console.log('Prisma keys:', Object.keys(prisma));
            process.exit(1);
        }
        console.log('Prisma.company is defined.');
        const count = await prisma.company.count();
        console.log('Company count:', count);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

check();
