
import { prisma } from './src/lib/prisma';

async function main() {
    const features = await prisma.feature.findMany();
    console.log('Current Features:', JSON.stringify(features, null, 2));
}

main().catch(console.error);
