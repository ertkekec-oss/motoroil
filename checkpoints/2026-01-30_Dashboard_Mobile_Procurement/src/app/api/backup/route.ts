import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch critical data
        // We use Promise.all to fetch concurrently for speed
        const [
            customers,
            suppliers,
            products,
            transactions,
            salesInvoices,
            purchaseInvoices,
            users,
            settings,
            serviceRecords,
            kasalar
        ] = await Promise.all([
            prisma.customer.findMany(),
            prisma.supplier.findMany(),
            prisma.product.findMany(),
            prisma.transaction.findMany(),
            prisma.salesInvoice.findMany(),
            prisma.purchaseInvoice.findMany(),
            prisma.user.findMany(), // Careful with passwords, but hash is okay for backup
            prisma.appSettings.findMany(),
            prisma.serviceRecord.findMany(),
            prisma.kasa.findMany()
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            data: {
                customers,
                suppliers,
                products,
                transactions,
                salesInvoices,
                purchaseInvoices,
                users,
                settings,
                serviceRecords,
                kasalar
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);

        // Return as a downloadable file
        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="system_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error: any) {
        console.error("Backup error:", error);
        return NextResponse.json(
            { success: false, error: 'Yedekleme oluşturulurken hata oluştu: ' + error.message },
            { status: 500 }
        );
    }
}
