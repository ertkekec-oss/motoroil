import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 50;
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

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || (!session.role?.includes('ADMIN') && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    const results: any[] = [];

    // Search logic for Tenants/Companies
    try {
        const tenants = await prisma.company.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { taxNumber: { contains: q, mode: 'insensitive' } }
                ]
            },
            take,
            select: { id: true, name: true, taxNumber: true }
        });
        tenants.forEach(t => {
            results.push({
                type: 'TENANT',
                id: t.id,
                title: t.name,
                subtitle: `Tax: ${t.taxNumber}`,
                href: `/admin/governance/companies?id=${t.id}`
            });
        });
    } catch { }

    // Search logic for Disputes
    try {
        const disputes = await (prisma as any).ticket.findMany({
            where: {
                category: 'Dispute',
                OR: [
                    { id: { contains: q, mode: 'insensitive' } },
                    { ticketNo: { contains: q, mode: 'insensitive' } }
                ]
            },
            take,
            select: { id: true, ticketNo: true, status: true }
        });
        disputes.forEach((d: any) => {
            results.push({
                type: 'DISPUTE',
                id: d.id,
                title: `Dispute #${d.ticketNo}`,
                subtitle: `Status: ${d.status}`,
                href: `/admin/resolutions/disputes?id=${d.id}`
            });
        });
    } catch { }

    // Combine and limit
    const finalItems = results.slice(0, take);

    return NextResponse.json({ items: finalItems });
}
