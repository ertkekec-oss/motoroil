import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PLANS & FEATURES DIAGNOSTIC ---');

    // 1. List all Features
    const features = await prisma.feature.findMany();
    console.log(`\nFound ${features.length} Features:`);
    features.forEach(f => console.log(` - [${f.key}]: ${f.name}`));

    // 2. List all Plans and their Features
    const plans = await prisma.plan.findMany({
        include: {
            features: {
                include: {
                    feature: true
                }
            }
        }
    });

    console.log(`\nFound ${plans.length} Plans:`);
    plans.forEach(p => {
        console.log(`\nPLAN: ${p.name} (ID: ${p.id})`);
        if (p.features.length === 0) {
            console.log('  ⚠️ NO FEATURES LINKED!');
        } else {
            console.log('  Features:');
            p.features.forEach(pf => console.log(`   + [${pf.feature.key}] ${pf.feature.name}`));
        }
    });

    // 3. Check for specific missing features mentioned by user
    const missingKeys = ['financial-management', 'service-management']; // Guesses for keys
    // I made up these keys, but listing all features in step 1 will reveal the real ones.
}

main().catch(console.error).finally(() => prisma.$disconnect());
