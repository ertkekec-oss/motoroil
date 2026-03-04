import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.role?.toUpperCase() || '';
        if (!['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        const limit = 50;
        const where: any = {};

        const configs = await prisma.tenantPortalConfig.findMany({
            where,
            take: limit,
            orderBy: { updatedAt: 'desc' }
        });

        // Resolve relations manually as TenantPortalConfig lacks direct prisma @relation to Company
        const supplierIds = Array.from(new Set(configs.map((c: any) => c.tenantId)));

        const suppliers = await prisma.company.findMany({
            where: { id: { in: supplierIds } },
            select: { id: true, name: true, vkn: true }
        });

        const supplierMap = new Map<string, any>(suppliers.map((s: any) => [s.id, s]));

        const items = configs.map((config: any) => {
            const supplierInfo = supplierMap.get(config.tenantId);
            return {
                tenantId: config.tenantId,
                tenantName: supplierInfo?.name || 'Bilinmeyen Tedarikçi',
                vkn: supplierInfo?.vkn || '-',
                dealerAuthMode: config.dealerAuthMode,
                updatedAt: config.updatedAt
            };
        });

        // Filter via q text strictly in memory if relations make DB queries complicated
        let filteredItems = items;
        if (q) {
            const lowQ = q.toLowerCase();
            filteredItems = items.filter(i =>
                i.tenantName.toLowerCase().includes(lowQ) ||
                i.tenantId.toLowerCase().includes(lowQ)
            );
        }

        return NextResponse.json({
            items: filteredItems,
            stats: {
                totalVisible: filteredItems.length
            }
        });

    } catch (error: any) {
        console.error('Admin B2B Policies Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
