
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: Tarih farkını gün olarak hesapla
const getDaysDiff = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export async function GET() {
    try {
        // 1. Tüm servis kayıtlarını çek (Sadece en son yapılan servisler. Her araç için son kaydı bulmamız lazım ama şu an basitçe tüm aktif araçları tarayalım)
        // İdeal senaryoda, her müşterinin son servis kaydını group by ile almak lazım ama Prisma'da raw query dışında biraz zor.
        // Şimdilik: "Tamamlandı" statüsündeki son 500 servisi çekip analiz edelim.

        const completedServices = await prisma.serviceRecord.findMany({
            where: {
                status: 'Tamamlandı',
                nextDate: { not: null }, // Gelecek randevu tarihi girilmişse
            },
            include: {
                customer: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 500,
        });

        const today = new Date();
        const upcomingAlerts = [];
        const overdueAlerts = [];

        for (const service of completedServices) {
            if (!service.nextDate) continue;

            const nextDate = new Date(service.nextDate);
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // UYARI MANTIĞI:

            // 1. GECİKENLER (Tarihi geçmiş)
            if (daysUntil < 0) {
                overdueAlerts.push({
                    type: 'overdue',
                    severity: 'high',
                    customerName: service.customer.name,
                    customerPhone: service.customer.phone,
                    plate: service.plate || 'Belirtilmemiş',
                    daysOverdue: Math.abs(daysUntil),
                    lastServiceDate: service.updatedAt,
                    message: `${service.customer.name} (${service.plate}) aracının bakımı ${Math.abs(daysUntil)} gün gecikti!`,
                    serviceId: service.id,
                    customerId: service.customerId
                });
            }

            // 2. YAKLAŞANLAR (30 gün kalmış)
            else if (daysUntil <= 30) {
                upcomingAlerts.push({
                    type: 'upcoming',
                    severity: daysUntil <= 7 ? 'medium' : 'low', // 1 hafta kala acil, 1 ay kala normal
                    customerName: service.customer.name,
                    customerPhone: service.customer.phone,
                    plate: service.plate || 'Belirtilmemiş',
                    daysLeft: daysUntil,
                    nextServiceDate: nextDate,
                    message: `${service.customer.name} (${service.plate}) bakımına ${daysUntil} gün kaldı.`,
                    serviceId: service.id,
                    customerId: service.customerId
                });
            }
        }

        // Özet İstatistikler
        const summary = {
            totalAlerts: overdueAlerts.length + upcomingAlerts.length,
            overdueCount: overdueAlerts.length,
            upcomingCount: upcomingAlerts.length,
        };

        return NextResponse.json({
            success: true,
            data: {
                summary,
                alerts: [...overdueAlerts, ...upcomingAlerts]
            }
        });

    } catch (error) {
        console.error('Servis uyarıları hatası:', error);
        return NextResponse.json({ success: false, error: 'Servis uyarıları alınamadı' }, { status: 500 });
    }
}
