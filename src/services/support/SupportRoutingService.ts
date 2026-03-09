import prisma from '@/lib/prisma';
import { SupportTicketPriority, SupportTicketCategory } from '@prisma/client';

export class SupportRoutingService {

    /**
     * 1. Detect Category automatically from content keywords
     */
    static detectCategory(title: string, description: string): SupportTicketCategory {
        const text = (title + ' ' + description).toLowerCase();

        if (text.includes('fatura') || text.includes('e-fatura') || text.includes('einvoice')) return 'EINVOICE';
        if (text.includes('ödeme') || text.includes('kredikartı') || text.includes('tahsilat')) return 'BILLING';
        if (text.includes('stok') || text.includes('envanter') || text.includes('depo')) return 'INVENTORY';
        if (text.includes('kargo') || text.includes('sevkiyat')) return 'SHIPPING';
        if (text.includes('entegrasyon') || text.includes('api')) return 'INTEGRATION';
        if (text.includes('salesx') || text.includes('saha')) return 'SALESX';
        if (text.includes('b2b') || text.includes('bayi')) return 'B2B_HUB';
        if (text.includes('hesap') || text.includes('şifre')) return 'ACCOUNT';

        return 'OTHER';
    }

    /**
     * 2. Detect Priority via urgency keywords
     */
    static detectPriority(title: string, description: string): SupportTicketPriority {
        const text = (title + ' ' + description).toLowerCase();

        if (
            text.includes('sistem çalışmıyor') ||
            text.includes('giriş yapamıyorum') ||
            text.includes('acil') ||
            text.includes('uygulama çöktü')
        ) {
            return 'CRITICAL';
        }

        if (
            text.includes('fatura gönderemiyorum') ||
            text.includes('hata veriyor') ||
            text.includes('ödeme alınamıyor') ||
            text.includes('çekmiyor')
        ) {
            return 'HIGH';
        }

        if (
            text.includes('nasıl') ||
            text.includes('nası') ||
            text.includes('yardım almak') ||
            text.includes('soru')
        ) {
            return 'LOW';
        }

        return 'NORMAL'; // default
    }

    /**
     * 3. Apply Tags Contextually
     */
    static async applyTags(ticketId: string, tenantId: string, title: string, description: string) {
        const text = (title + ' ' + description).toLowerCase();
        const tagSlugsToApply: string[] = [];

        if (text.includes('e-fatura') || text.includes('fatura')) tagSlugsToApply.push('einvoice');
        if (text.includes('stok') || text.includes('envanter')) tagSlugsToApply.push('inventory');
        if (text.includes('ödeme') || text.includes('kredi')) tagSlugsToApply.push('payment');
        if (text.includes('hata') || text.includes('error')) tagSlugsToApply.push('bug');

        // System-wide Global Tags via tenantId=null
        for (const slug of tagSlugsToApply) {
            let tag = await prisma.supportTicketTag.findFirst({
                where: { tenantId: null, slug }
            });

            if (!tag) {
                tag = await prisma.supportTicketTag.create({
                    data: {
                        tenantId: null, // Global
                        name: slug.charAt(0).toUpperCase() + slug.slice(1),
                        slug,
                        color: slug === 'bug' ? 'red' : 'blue'
                    }
                });
            }

            await prisma.supportTicketTagMap.findFirst({
                where: { ticketId, tagId: tag.id }
            }).then(async (existingMap) => {
                if (!existingMap) {
                    await prisma.supportTicketTagMap.create({
                        data: { ticketId, tagId: tag.id }
                    });
                }
            });
        }
    }

    /**
     * 4. Assign Ticket automatically (Mock structural pattern)
     */
    static async assignTicket(ticketId: string, category: SupportTicketCategory) {
        console.log(`[SupportRoutingService] Routing Ticket ${ticketId} [${category}] to appropriate queues.`);
        // Future iteration: Map category -> assignedGroup or assignedToUserId
    }
}
