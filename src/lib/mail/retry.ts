import { prisma } from "@/lib/prisma";
import { publishEvent } from "../events";

export async function handleFailedMailLog(logId: string, errorMessage: string) {
    // 1) Update Log if not already
    const log = await prisma.mailDeliveryLog.update({
        where: { id: logId },
        data: {
            status: 'FAILED',
            errorMessage: errorMessage,
        }
    });

    // 2) Publish Event
    await publishEvent({
        type: 'MAIL_FAILED',
        tenantId: log.tenantId,
        companyId: log.companyId || undefined,
        relatedEntityType: 'MailDeliveryLog',
        relatedEntityId: log.id,
        title: 'Mail Gönderimi Başarısız',
        message: `${log.to} adresine e-posta iletilemedi. Sağlayıcı: ${log.provider}`,
        meta: {
            subject: log.subject,
            error: errorMessage,
            to: log.to
        }
    });

    console.log(`[MAIL_RETRY_HOOK] MailFailedEvent dispatched for log: ${log.id}`);
}

// Future Function:
// export async function retryFailedMails(tenantId: string) { ... }
