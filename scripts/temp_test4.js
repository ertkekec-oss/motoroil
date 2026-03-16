const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const events = await prisma.signatureAuditEvent.findMany({ take: 3, orderBy: { createdAt: 'desc' }, where: { action: 'OTP_SENT' }});
    const configs = await prisma.otpProviderConfig.findMany();
    const envelopes = await prisma.signatureEnvelope.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
    fs.writeFileSync('test.json', JSON.stringify({ events, configs, envelopes }, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
