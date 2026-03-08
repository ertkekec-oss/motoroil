const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const s = await prisma.signatureSession.findFirst({
        where: { tokenHash: '48354e67e1ed6e008e7b8decaed127514a2f72bc7415ff7babf996f63b1ca1df' },
        include: { envelope: { include: { recipients: true } }, recipient: true }
    });
    fs.writeFileSync('status_utf8.json', JSON.stringify(s, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());
