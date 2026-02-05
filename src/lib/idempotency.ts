
import prisma from './prisma';

export async function withIdempotency(
    provider: string,
    key: string,
    entityType: string,
    entityId: string,
    action: () => Promise<any>
) {
    const existing = await prisma.externalRequest.findUnique({
        where: {
            provider_idempotencyKey: {
                provider,
                idempotencyKey: key
            }
        }
    });

    // 1. Durum Kontrolü
    if (existing) {
        if (existing.status === 'SUCCESS') {
            return {
                source: 'CACHE',
                data: existing.responsePayload
            };
        }
        if (existing.status === 'PENDING') {
            // İkinci istek çok hızlı gelirse (double click)
            // Race condition: İki thread de PENDING yazmaya çalışabilir ama unique constraint korur.
            // Fakat burada sadece check yapıyoruz. 
            // Eğer PENDING ise ve oluşturulma tarihi çok yeniyse (< 1dk) beklet veya hata dön.
            const ageInfo = (Date.now() - existing.createdAt.getTime()) / 1000;
            if (ageInfo < 60) {
                throw new Error("REQUEST_ALREADY_PROCESSING: Bu işlem şu anda yürütülüyor, lütfen bekleyiniz.");
            }
            // Eğer PENDING ama 1 dk geçmişse, önceki işlem ölmüş olabilir. Retry'a izin ver (veya status check yap).
            // Şimdilik yeniden denemeye izin veriyoruz (failover).
        }
    }

    // 2. Kaydı Oluştur / Güncelle (PENDING)
    // Eğer kayıt varsa ve failed/stuck ise güncelle, yoksa oluştur
    if (existing) {
        await prisma.externalRequest.update({
            where: { id: existing.id },
            data: { status: 'PENDING', updatedAt: new Date() }
        });
    } else {
        await prisma.externalRequest.create({
            data: {
                provider,
                idempotencyKey: key,
                entityType,
                entityId,
                status: 'PENDING'
            }
        });
    }

    // 3. İşlemi Gerçekleştir
    try {
        const result = await action();

        // 4. Başarı Kaydı
        await prisma.externalRequest.update({
            where: {
                provider_idempotencyKey: { provider, idempotencyKey: key }
            },
            data: {
                status: 'SUCCESS',
                responsePayload: result as any, // Json compatible
                updatedAt: new Date()
            }
        });

        return {
            source: 'LIVE',
            data: result
        };

    } catch (error: any) {
        // 5. Hata Kaydı
        // Sadece kesin fail durumunda FAILED yapıyoruz.
        // Retryable hatalarda belki PENDING bırakıp job'ın devralmasını sağlayabiliriz.
        // Ancak basitlik adına FAILED işaretleyelim, böylece kullanıcı tekrar deneyebilir.
        console.error(`External Action Failed [${provider}]:`, error);

        await prisma.externalRequest.update({
            where: {
                provider_idempotencyKey: { provider, idempotencyKey: key }
            },
            data: {
                status: 'FAILED',
                responsePayload: { error: error.message } as any,
                updatedAt: new Date()
            }
        });

        throw error;
    }
}
