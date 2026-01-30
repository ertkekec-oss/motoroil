import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Günlük Ciro (Bugün oluşturulan tüm siparişlerin toplamı)
        const dailySales = await prisma.order.aggregate({
            _sum: {
                totalAmount: true
            },
            where: {
                orderDate: {
                    gte: today
                },
                status: 'Tamamlandı' // Sadece tamamlanan satışlar ciroya dahil
            }
        });

        const dailyRevenue = dailySales._sum.totalAmount || 0;

        // 2. Günlük Kasa (Bugün yapılan Nakit satışlar - Basit yaklaşım)
        // Not: Gerçek kasa yönetimi için Transaction tablosu gerekir, şimdilik POS Nakit satışları baz alıyoruz.
        // POS satışlarında ödeme yöntemi rawData içinde JSON olarak saklanıyor.
        // Prisma JSON filtreleme her DB'de farklı olduğu için, basitçe POS satışlarını çekip JS ile filtreleyeceğiz.

        const posSales = await prisma.order.findMany({
            where: {
                marketplace: 'POS',
                orderDate: { gte: today },
                status: 'Tamamlandı'
            },
            select: {
                totalAmount: true,
                rawData: true
            }
        });

        let dailyCash = 0;
        posSales.forEach(sale => {
            const data = sale.rawData as any;
            if (data && data.paymentMode === 'cash') {
                dailyCash += sale.totalAmount;
            }
        });

        // Eğer veritabanında henüz hiç "Tamamlandı" yoksa, mock değerleri değil 0 dönüyoruz

        return NextResponse.json({
            success: true,
            revenue: dailyRevenue,
            cash: dailyCash
        });

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
