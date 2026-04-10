import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        if (searchParams.get('secret') !== 'periodya_migrate_123') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companies = await prisma.company.findMany();
        let logs: string[] = [];
        
        for (const company of companies) {
            const companyId = company.id;
            logs.push(`Processing company: ${company.name} (${companyId})`);

            const branches = await prisma.branch.findMany({
                where: { companyId }
            });

            if (branches.length === 0) {
                logs.push(`No actual branches configured for company ${company.name}.`);
                continue;
            }

            const targetBranchName = branches[0].name; // usually KAYSERİ
            logs.push(`Targeting existing branch: ${targetBranchName}`);

            const merkezStocks = await prisma.stock.findMany({
                where: { product: { companyId }, branch: 'Merkez' }
            });

            logs.push(`Found ${merkezStocks.length} stock entries in Merkez for company ${company.name}.`);

            let mergedCount = 0;
            for (const ms of merkezStocks) {
                const existing = await prisma.stock.findFirst({
                    where: { productId: ms.productId, branch: targetBranchName }
                });

                if (existing) {
                    await prisma.stock.update({
                        where: { id: existing.id },
                        data: { quantity: existing.quantity + ms.quantity }
                    });
                    await prisma.stock.delete({ where: { id: ms.id } });
                } else {
                    await prisma.stock.update({
                        where: { id: ms.id },
                        data: { branch: targetBranchName }
                    });
                }
                mergedCount++;
            }

            logs.push(`Merged ${mergedCount} stocks from Merkez to ${targetBranchName}.`);

            try {
                const updatedOrders = await prisma.order.updateMany({
                    where: { companyId, branch: 'Merkez' },
                    data: { branch: targetBranchName }
                });
                logs.push(`Updated ${updatedOrders.count} orders.`);
            } catch (e) {}

            try {
                const updatedWayslips = await prisma.waySlip.updateMany({
                    where: { companyId, branch: 'Merkez' },
                    data: { branch: targetBranchName }
                });
                logs.push(`Updated ${updatedWayslips.count} wayslips.`);
            } catch (e) {}

            try {
                const updatedInvoices = await prisma.salesInvoice.updateMany({
                    where: { companyId, branch: 'Merkez' },
                    data: { branch: targetBranchName }
                });
                logs.push(`Updated ${updatedInvoices.count} invoices.`);
            } catch (e) {}

            try {
                const updatedMoves = await prisma.stockMovement.updateMany({
                    where: { companyId, branch: 'Merkez' },
                    data: { branch: targetBranchName }
                });
                logs.push(`Updated ${updatedMoves.count} stock movements.`);
            } catch (e) {}
        }

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
