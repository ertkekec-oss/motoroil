import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.otpProviderConfig.findMany();
    console.log("OtpProviderConfigs:", configs);

    const envs = await prisma.signatureEnvelope.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { id: true, tenantId: true, recipients: { select: { phone: true } } }});
    console.log("Envelopes:", JSON.stringify(envs, null, 2));

    const events = await prisma.signatureAuditEvent.findMany({ take: 5, orderBy: { createdAt: 'desc' }, where: { action: 'OTP_SENT' }});
    console.log("Recent Audit Events for OTP_SENT:", JSON.stringify(events, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
