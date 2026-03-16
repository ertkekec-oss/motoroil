import { prisma } from '../src/lib/prisma';
import fs from 'fs';

async function test() {
    try {
        const session = await prisma.signatureSession.findFirst({
            include: {
                envelope: true,
                recipient: {
                    include: { signer: true }
                }
            }
        });
        if (!session) {
            console.log("No session found");
            return;
        }

        const envelope = session.envelope;

        // Try getting config
        const config = await prisma.otpProviderConfig.findUnique({
            where: { tenantId_providerName: { tenantId: envelope.tenantId, providerName: 'NETGSM' } }
        });
        
        console.log("Config:", config);

        const resolvedPhone = session.recipient.phone || session.recipient.signer?.phone;
        console.log("Resolved Phone:", resolvedPhone);

        // Code creation
        const codeHash = 'dummydummy';
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 300);

        const tryCreate = await prisma.otpVerification.create({
            data: {
                tenantId: envelope.tenantId,
                phone: resolvedPhone || '5330213403',
                codeHash,
                expiresAt,
                sessionId: session.id
            }
        });
        console.log("Try create OTP verif:", tryCreate);
        
        await prisma.otpVerification.delete({
           where: { id: tryCreate.id }
        });

    } catch (e) {
        console.error("ERROR CAUGHT IN TEST:", e);
    }
}

test();
