import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.otpProviderConfig.findMany();
    //console.log("OtpProviderConfigs:", JSON.stringify(configs, null, 2));

    const events = await prisma.signatureAuditEvent.findMany({ take: 3, orderBy: { createdAt: 'desc' }, where: { action: 'OTP_SENT' }});
    console.log("EVENTS:");
    console.log(JSON.stringify(events, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
