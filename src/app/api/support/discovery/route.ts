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
                    completedKeys: [],
                    completedPct: 0
                }
            });
        }

        // Fetch dynamic steps completely from the database
        const dbSteps = await prisma.onboardingStep.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        let steps: any[] = [];
        let completedCount = 0;

        if (dbSteps.length === 0) {
            // Fallback to defaults to not break existing instances that are upgrading
            steps = [
                { id: "firstInvoice", actionKey: "firstInvoice", title: "İlk Faturayı Oluştur", desc: "Satış faturası keserek başlayın.", href: "/sales/invoices/new", completed: progress.firstInvoice },
                { id: "firstCustomer", actionKey: "firstCustomer", title: "İlk Müşteriyi Ekle", desc: "Cari kart oluşturun.", href: "/customers", completed: progress.firstCustomer },
                { id: "inventoryViewed", actionKey: "inventoryViewed", title: "Stok Yönetimini Keşfet", desc: "Envanter modülüne göz atın.", href: "/inventory", completed: progress.inventoryViewed }
            ];
            completedCount = [progress.firstInvoice, progress.firstCustomer, progress.inventoryViewed].filter(Boolean).length;
        } else {
            steps = dbSteps.map((step) => {
                const isCompleted = progress!.completedKeys.includes(step.actionKey);
                if (isCompleted) completedCount++;
                return {
                    id: step.actionKey,
                    actionKey: step.actionKey,
                    title: step.title,
                    desc: step.description || "",
                    href: step.href,
                    completed: isCompleted
                };
            });
        }

        const calculatedPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 100;

        return NextResponse.json({
            ...progress,
            steps,
            completedPct: calculatedPct
        });
    } catch (e: any) {
        console.error("Discovery API Error:", e);
        return NextResponse.json({
            tenantId: auth.user?.tenantId,
            steps: [],
            completedPct: 0
        });
    }
}
