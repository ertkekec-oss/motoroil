import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let progress = await prisma.productOnboardingProgress.findUnique({
            where: { tenantId: auth.user.tenantId }
        });

        if (!progress) {
            progress = await prisma.productOnboardingProgress.create({
                data: {
                    tenantId: auth.user.tenantId,
                    firstInvoice: false,
                    firstCustomer: false,
                    inventoryViewed: false,
                    salesXViewed: false,
                    b2bHubViewed: false,
                    completedPct: 0
                }
            });
        }

        return NextResponse.json(progress);
    } catch (e: any) {
        console.error("Discovery API Error:", e);
        // Fallback for mock if DB schema not ready immediately
        return NextResponse.json({
            tenantId: auth.user?.tenantId,
            firstInvoice: false,
            firstCustomer: false,
            inventoryViewed: false,
            salesXViewed: false,
            b2bHubViewed: false,
            completedPct: 0
        });
    }
}
