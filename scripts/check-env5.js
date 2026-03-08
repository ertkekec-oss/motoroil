const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const e = await prisma.signatureEnvelope.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { sessions: true }
    });
    console.log(e.id, 'otpRequired:', e.otpRequired, 'token:', e.sessions[0].tokenHash);
}

main().catch(console.error).finally(() => prisma.$disconnect());
