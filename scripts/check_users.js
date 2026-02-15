const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            accessibleCompanies: {
                include: {
                    company: true
                }
            }
        }
    });
    const output = JSON.stringify(users, null, 2);
    fs.writeFileSync('users_debug.json', output, 'utf8');
    console.log('Saved to users_debug.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
