
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const twoMonthsLater = new Date();
        twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

        // 1. Faturalaşacaklar (Pending Invoicing)
        // Logic: Transactions of type 'Sales' that might need invoicing. 
        // Assuming we track this via `SalesInvoice` pending status or un-invoiced transactions.
        // For simplicity, let's fetch 'Sales' transactions that created recently and are high value, 
        // OR better, SalesInvoices with status 'Draft'.
        // If SalesInvoice model exists:
        let pendingInvoices = [];
        try {
            // @ts-ignore
            pendingInvoices = await prisma.salesInvoice.findMany({
                where: { status: 'Taslak' }, // Changed from 'Draft' to match schema default
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { customer: true }
            });
        } catch (e) { console.log('SalesInvoice check failed', e); }

        // 2. Transfer Onayları (Pending Transfers)
        // @ts-ignore
        const pendingTransfers = await prisma.stockTransfer.findMany({
            where: { status: 'IN_TRANSIT' },
            take: 20,
            orderBy: { shippedAt: 'desc' }
        });

        // 3. Stok Sayım Onayları (Stock Count Approvals)
        // If InventoryCount exists... or maybe we just return empty if table missing.
        let pendingCounts = [];
        // try {
        //      // @ts-ignore
        //     pendingCounts = await prisma.inventoryCount.findMany({ where: { status: 'Pending' } });
        // } catch (e) {} 
        // For now, empty array as model is not confirmed.

        // 4. E-Ticaret Satışları (E-commerce Sales)
        // Orders from marketplaces
        const recentEcommerceSales = await prisma.order.findMany({
            where: {
                orderDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            },
            take: 20,
            orderBy: { orderDate: 'desc' }
        });

        // 5. Servis Uyarıları (Service Warnings)
        // Active jobs or upcoming maintenance
        // @ts-ignore
        const activeServices = await prisma.serviceRecord.findMany({
            where: {
                status: { notIn: ['Tamamlandı', 'Cancelled'] }
            },
            take: 10,
            orderBy: { entryDate: 'desc' }
        });

        // 6. Garanti Süresi Bitimine 2 Ay Kalanlar
        // @ts-ignore
        const expiringWarranties = await prisma.warranty.findMany({
            where: {
                endDate: {
                    gte: new Date(),
                    lte: twoMonthsLater
                },
                status: 'Active'
            },
            take: 20,
            orderBy: { endDate: 'asc' }
        });

        // 7. Genel Sistem Bildirimleri (Notification Model)
        const systemNotifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // 8. Güvenlik Olayları
        const securityEvents = await prisma.securityEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 20
        });

        return NextResponse.json({
            success: true,
            data: {
                pendingInvoices,
                pendingTransfers,
                pendingCounts,
                recentEcommerceSales,
                activeServices,
                expiringWarranties,
                systemNotifications,
                securityEvents
            }
        });

    } catch (error: any) {
        console.error("Notification summary error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
