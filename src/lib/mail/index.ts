import { prisma } from "@/lib/prisma";
import { handleFailedMailLog } from "./retry";
import { MockMailProvider } from "./providers/mock";
import { SesMailProvider } from "./providers/aws-ses";
import { ResendMailProvider } from "./providers/resend";
import { SmtpMailProvider } from "./providers/smtp";

export interface MailPayload {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    html?: string;
    text?: string;
    tenantId?: string;
    companyId?: string;
    category?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

export interface MailProvider {
    name: string;
    send(payload: MailPayload): Promise<{ messageId?: string; error?: string }>;
}

function getProvider(): MailProvider {
    const providerType = process.env.MAIL_PROVIDER?.toLowerCase() || 'smtp'; // default to smtp when empty

    switch (providerType) {
        case 'ses':
            return new SesMailProvider();
        case 'resend':
            return new ResendMailProvider();
        case 'smtp':
            return new SmtpMailProvider();
        case 'mock':
        default:
            return new MockMailProvider();
    }
}

export async function sendMail(payload: MailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // If no tenantId is provided, we use a fallback 'SYSTEM' tenant for global operational emails.
    // In Periodya, tenantId is usually mandatory.
    const tenantId = payload.tenantId || 'SYSTEM';

    const provider = getProvider();

    // 1) First, create a MailDeliveryLog entry with PENDING status.
    const deliveryLog = await prisma.mailDeliveryLog.create({
        data: {
            tenantId,
            companyId: payload.companyId,
            provider: provider.name,
            to: payload.to,
            subject: payload.subject,
            category: payload.category || 'GENERAL',
            status: 'PENDING',
            relatedEntityType: payload.relatedEntityType,
            relatedEntityId: payload.relatedEntityId,
        }
    });

    try {
        // 2) Delegate sending to the configured provider
        const result = await provider.send(payload);

        if (result.error) {
            await handleFailedMailLog(deliveryLog.id, result.error);
            return { success: false, error: result.error };
        }

        // 3) Mark as SENT on success
        await prisma.mailDeliveryLog.update({
            where: { id: deliveryLog.id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                // Use messageId if we want to store it in errorMessage column (or add a separate column later)
            }
        });

        return { success: true, messageId: result.messageId };

    } catch (error: any) {
        // 4) Catch any unexpected runtime errors
        const errorMessage = error instanceof Error ? error.message : String(error);

        await handleFailedMailLog(deliveryLog.id, errorMessage);

        return { success: false, error: errorMessage };
    }
}
