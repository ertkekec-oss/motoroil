import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        const tenantId = session.tenantId;

        // Find active company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId }
        });

        if (!company && tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const activeBranch = req.headers.get("x-active-branch");
        const branchFilter = (activeBranch && activeBranch !== 'Tümü' && activeBranch !== 'Global' && activeBranch !== 'TÜM ŞUBELER') 
            ? { branch: decodeURIComponent(activeBranch) } 
            : {};
            
        // Admin or Manager? 
        // If not system admin, might enforce branch isolation. Handled mostly in UI & API with activeBranch.
        // Let's enforce using the `branchFilter`. For fully open admin, branch Filter could be {} if activeBranch = 'Tümü'.

        const whereClause = {
            ...(company ? { companyId: company.id } : {}),
            ...branchFilter
        };

        // 1. Receivables (Sales Invoices)
        const salesInvoices = await prisma.salesInvoice.findMany({
            where: {
                ...whereClause,
                dueDate: { not: null },
                status: { notIn: ['PAID', 'CANCELLED'] }
            },
            include: { customer: { select: { name: true } } }
        });

        // 2. Payables (Purchase Invoices)
        const purchaseInvoices = await prisma.purchaseInvoice.findMany({
            where: {
                ...whereClause,
                dueDate: { not: null },
                status: { notIn: ['PAID', 'CANCELLED'] }
            },
            include: { supplier: { select: { name: true } } }
        });

        // 3. Checks / Promissory Notes
        const checks = await prisma.check.findMany({
            where: {
                ...whereClause,
                dueDate: { not: null },
                status: { notIn: ['CASHED', 'CANCELLED'] }
            },
            include: { 
                customer: { select: { name: true } },
                supplier: { select: { name: true } }
            }
        });

        // 4. Tasks and Reminders
        const globalTasks = await prisma.globalTask.findMany({
            where: {
                ...whereClause,
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            include: {
                assignee: { select: { name: true } }
            }
        });

        // Compile Events
        const events = [
            ...salesInvoices.map(si => ({
                id: `si_${si.id}`,
                originalId: si.id,
                title: `Tahsilat: ${si.customer?.name || 'Bilinmiyor'}`,
                description: `Fatura Numarası: ${si.number || '-'}`,
                type: 'RECEIVABLE',
                date: si.dueDate,
                status: si.status,
                amount: typeof si.totalAmount === 'object' ? Number(si.totalAmount) : si.totalAmount,
                assignee: 'Finans',
            })),
            ...purchaseInvoices.map(pi => ({
                id: `pi_${pi.id}`,
                originalId: pi.id,
                title: `Ödeme: ${pi.supplier?.name || 'Bilinmiyor'}`,
                description: `Fatura Numarası: ${pi.number || '-'}`,
                type: 'PAYABLE',
                date: pi.dueDate,
                status: pi.status,
                amount: typeof pi.totalAmount === 'object' ? Number(pi.totalAmount) : pi.totalAmount,
                assignee: 'Finans',
            })),
            ...checks.map(chk => ({
                id: `chk_${chk.id}`,
                originalId: chk.id,
                title: `${(chk as any).type === 'GIVEN' ? 'Verilen Çek' : 'Alınan Çek'}: ${(chk as any).type === 'GIVEN' ? chk.supplier?.name : chk.customer?.name}`,
                description: `Çek Numarası: ${chk.number || '-'}`,
                type: (chk as any).type === 'GIVEN' ? 'CHECK_OUT' : 'CHECK_IN',
                date: chk.dueDate,
                status: chk.status,
                amount: typeof chk.amount === 'object' ? Number(chk.amount) : chk.amount,
                assignee: 'Finans',
            })),
            ...globalTasks.filter(gt => gt.startTime || gt.dueDate).map(gt => ({
                id: `gt_${gt.id}`,
                originalId: gt.id,
                title: gt.title,
                description: gt.description || '',
                type: 'TASK',
                date: gt.startTime || gt.dueDate,
                status: gt.status,
                assignee: gt.assignee?.name || 'Atanmamış',
            }))
        ];

        return NextResponse.json({ success: true, events });

    } catch (e: any) {
        console.error("Global calendar fetch API error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
