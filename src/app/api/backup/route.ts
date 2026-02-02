import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch ALL system data for a complete backup (Restore Point)
        // We exclude heavy blob/document tables to prevent memory issues and huge JSON files.
        // Document tables excluded: CustomerDocument, BranchDocument, StaffDocument

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
            kasalar,

            // New Modules
            staff,
            campaigns,
            coupons,
            checks,
            branches,
            stockTransfers,
            stockMovements,
            warranties,
            securityEvents,
            paymentPlans,
            installments,
            shifts,
            payrolls,
            leaveRequests,
            notifications,

            // Pending & Suspended
            pendingProducts,
            pendingTransfers,
            suspendedSales,

            // E-Commerce
            marketplaceConfigs,
            orders,
            marketplaceProductMaps,

            // Stocks
            stocks,

            // Accounting
            accounts,
            journals,
            journalItems
        ] = await Promise.all([
            prisma.customer.findMany(),
            prisma.supplier.findMany(),
            prisma.product.findMany(),
            prisma.transaction.findMany(),
            prisma.salesInvoice.findMany(),
            prisma.purchaseInvoice.findMany(),
            prisma.user.findMany(),
            prisma.appSettings.findMany(),
            prisma.serviceRecord.findMany(),
            prisma.kasa.findMany(),

            prisma.staff.findMany(),
            prisma.campaign.findMany(),
            prisma.coupon.findMany(),
            prisma.check.findMany(),
            prisma.branch.findMany(),
            prisma.stockTransfer.findMany(),
            prisma.stockMovement.findMany(),
            prisma.warranty.findMany(),
            prisma.securityEvent.findMany(),
            prisma.paymentPlan.findMany(),
            prisma.installment.findMany(),
            prisma.shift.findMany(),
            prisma.payroll.findMany(),
            prisma.leaveRequest.findMany(),
            prisma.notification.findMany(),

            prisma.pendingProduct.findMany(),
            prisma.pendingTransfer.findMany(),
            prisma.suspendedSale.findMany(),

            prisma.marketplaceConfig.findMany(),
            prisma.order.findMany(),
            prisma.marketplaceProductMap.findMany(),

            prisma.stock.findMany(),

            // Accounting
            prisma.account.findMany(),
            prisma.journal.findMany(),
            prisma.journalItem.findMany()
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            version: '2.0', // Updated structure
            description: 'Full System Restore Point',
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
                kasalar,

                staff,
                campaigns,
                coupons,
                checks,
                branches,
                stockTransfers,
                stockMovements,
                warranties,
                securityEvents,
                paymentPlans,
                installments,
                shifts,
                payrolls,
                leaveRequests,
                notifications,

                pendingProducts,
                pendingTransfers,
                suspendedSales,

                marketplaceConfigs,
                orders,
                marketplaceProductMaps,

                stocks,

                accounts,
                journals,
                journalItems
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="periodya_restore_point_${new Date().toISOString().replace(/[:.]/g, '-')}.json"`
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
