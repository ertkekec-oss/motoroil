import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Rate limiting (in-memory token bucket replacement)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 30;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string) {
    const now = Date.now();
    const current = rateLimits.get(userId) || { count: 0, resetAt: now + WINDOW_MS };

    if (now > current.resetAt) {
        current.count = 1;
        current.resetAt = now + WINDOW_MS;
    } else {
        current.count++;
    }

    rateLimits.set(userId, current);
    return current.count <= LIMIT;
}

// Simple masker for tracking number
function maskTrackingNumber(tn: string) {
    if (!tn || tn.length < 8) return '****';
    return tn.substring(0, 4) + '*'.repeat(tn.length - 7) + tn.substring(tn.length - 3);
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(session.id)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const take = Math.min(parseInt(searchParams.get('take') || '10', 10), 20);

    if (q.length < 2) {
        return NextResponse.json({ items: [] });
    }

    const companyId = session.companyId;

    const results: any[] = [];

    // Search logic for Orders (Seller & Buyer)
    try {
        const orders = await prisma.networkOrder.findMany({
            where: {
                OR: [
                    { sellerId: companyId },
                    { buyerId: companyId }
                ],
                OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { refNumber: { contains: q, mode: 'insensitive' } }
                ]
            },
            take,
            select: { id: true, refNumber: true, totalAmount: true, role: true } // Be careful, role isn't a direct field usually, assuming it's inferred
        });

        // Prisma doesn't always have simple OR nested relations. We will just use the returned rows.
        orders.forEach(o => {
            const role = o.sellerId === companyId ? 'SELLER' : 'BUYER';
            results.push({
                type: 'ORDER',
                id: o.id,
                title: `Order: ${o.refNumber || o.id.split('-')[0]}`,
                subtitle: `Amount: ₺${o.totalAmount} (${role})`,
                href: role === 'SELLER' ? '/network/seller/orders' : '/network/buyer/orders'
            });
        });
    } catch { }

    // Search logic for Support Tickets
    try {
        const tickets = await prisma.ticket.findMany({
            where: {
                tenantId: companyId,
                OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { subject: { contains: q, mode: 'insensitive' } }
                ]
            },
            take,
            select: { id: true, ticketNo: true, subject: true, status: true }
        });
        tickets.forEach(t => {
            results.push({
                type: 'TICKET',
                id: t.id,
                title: `Ticket #${t.ticketNo}`,
                subtitle: `${t.subject} (${t.status})`,
                href: `/support/tickets?id=${t.id}`
            });
        });
    } catch { }

    // Finance - Invoices
    try {
        const invoices = await (prisma as any).boostInvoice.findMany({
            where: {
                tenantId: companyId,
                id: { contains: q, mode: 'insensitive' }
            },
            take,
            select: { id: true, period: true, status: true }
        });
        invoices.forEach((i: any) => {
            results.push({
                type: 'FINANCE_INVOICE',
                id: i.id,
                title: `Invoice: ${i.period}`,
                subtitle: `Status: ${i.status}`,
                href: `/network/finance?tab=invoices`
            });
        });
    } catch { }

    // Combine and limit
    const finalItems = results.slice(0, take);

    return NextResponse.json({ items: finalItems });
}
