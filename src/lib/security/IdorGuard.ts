import { NextResponse } from 'next/server';

/**
 * 🛡️ IDOR (Insecure Direct Object Reference) Guard
 * Her API rotasında veri çekmeden veya silmeden önce, çağrılan verinin (Örn: Faturanın)
 * gerçekten o anki oturumdaki şirkete ait olup olmadığını denetleyen zırh katmanı.
 */
export class IdorGuard {
    
    /**
     * Gelen verinin `companyId`'si ile Auth Session'daki `companyId`'yi kıyaslar.
     * Eğer uyuşmuyorsa, kişi URL'deki ID ile oynayıp başka bir şirketi sızdırmaya çalışıyor demektir.
     */
    static enforceOwnership(resourceCompanyId: string, sessionCompanyId: string) {
        if (!resourceCompanyId || !sessionCompanyId) {
            throw new Error("SEC_ERR: Missing Context Data");
        }

        if (resourceCompanyId !== sessionCompanyId) {
            console.error(`🚨 [SECURITY BREACH ATTEMPT] IDOR Detected. Session ${sessionCompanyId} tried to access resource of ${resourceCompanyId}`);
            throw new Error("SEC_ERR_IDOR: Bu veriye erişim yetkiniz bulunmuyor. (Insecure Direct Object Reference Engellendi)");
        }
    }

    /**
     * Prisma 'where' cümleciğine otomatik olarak tenant izolasyonu ekler
     * Kullanım: prisma.product.findMany({ where: IdorGuard.safeWhere(session, { category: 'A' }) })
     */
    static safeWhere(sessionCompanyId: string, additionalConditions: any = {}) {
        return {
            companyId: sessionCompanyId,
            ...additionalConditions
        };
    }
}
