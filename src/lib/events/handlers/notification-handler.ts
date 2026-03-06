import { prisma } from "@/lib/prisma";
import { AppEvent } from "../types";

export async function handleNotificationEvent(event: AppEvent) {
    if (!event.tenantId) return;

    // Use event.userId if provided, else assign generic tenant notification
    // Future Note: Could map certain events to specific user roles via tenant users 
    // e.g., FINANS is responsible for RECONCILIATION_DISPUTED, vs SUPERADMINs for MAIL_FAILED
    const assignedUserId = event.userId || null;

    let title = event.title || 'Sistem Bildirimi';
    let message = event.message || 'Sistemden yeni bir güncelleme var.';

    // Construct Notification Texts by Default if title/message missing
    switch (event.type) {
        case 'SIGNATURE_INVITATION_SENT':
            title = event.title || 'Yeni İmza Daveti Gönderildi';
            message = event.message || `Belge imzalama talebi başarıyla alıcısına iletildi.`;
            break;
        case 'SIGNATURE_COMPLETED':
            title = event.title || 'Zarf İmzalandı (Tamamlandı)';
            if (!event.message) message = `Tebrikler! Belge taraflarca imzalandı.`;
            break;
        case 'SIGNATURE_REJECTED':
            title = event.title || 'Zarf Reddedildi';
            if (!event.message) message = `Belge imzacılardan biri tarafından iptal edildi.`;
            break;
        case 'RECONCILIATION_SENT':
            title = event.title || 'Mutabakat Gönderildi';
            if (!event.message) message = `Müşterinize/Tedarikçinize mutabakat formu iletildi.`;
            break;
        case 'RECONCILIATION_VIEWED':
            title = event.title || 'Mutabakat Görüntülendi';
            break;
        case 'RECONCILIATION_DISPUTED':
            title = event.title || 'Mutabakatta Uyuşmazlık';
            if (!event.message) message = `Müşteriniz mevcut bakiyeye itiraz etti.`;
            break;
        case 'DISPUTE_RESOLVED':
            title = event.title || 'Uyuşmazlık Çözüldü';
            break;
        case 'OTP_FAILED':
            title = event.title || 'OTP Gönderim Hatası';
            if (!event.message) message = `Sistemde SMS gönderimi sağlanamadı. Lütfen ayarları kontrol edin.`;
            break;
        case 'MAIL_FAILED':
            title = event.title || 'Mail İletim Hatası';
            if (!event.message) message = `E-Posta sağlacısı (SES/Resend) üzerinde hata mesajı alındı.`;
            break;
        default: break;
    }

    try {
        await prisma.appNotification.create({
            data: {
                tenantId: event.tenantId,
                companyId: event.companyId,
                userId: assignedUserId,
                type: event.type,
                title,
                message,
                relatedEntityType: event.relatedEntityType,
                relatedEntityId: event.relatedEntityId,
                metaJson: event.meta ? JSON.parse(JSON.stringify(event.meta)) : null
            }
        });
    } catch (e) {
        console.error("[EVENT NOTIFICATION BRIDGE ERROR]", e);
    }
}
