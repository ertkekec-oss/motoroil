import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        const whereScope = tenantId ? { tenantId } : {};

        // Parallel metrics fetching
        const [
            totalTickets,
            openTickets,
            resolvedTickets,
            breachedSLAs,
            tagStats
        ] = await Promise.all([
            prisma.supportTicket.count({ where: whereScope }),
            prisma.supportTicket.count({ where: { ...whereScope, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } } }),
            prisma.supportTicket.count({ where: { ...whereScope, status: 'RESOLVED' } }),
            prisma.supportSLATracking.count({
                where: {
                    status: 'BREACHED',
                    ticket: whereScope
                }
            }),
            // Simple raw or group by simulation for tag counts. We will fetch heavily used tags from mapper.
            prisma.supportTicketTagMap.groupBy({
                by: ['tagId'],
                _count: { tagId: true },
                orderBy: { _count: { tagId: 'desc' } },
                take: 5
            })
        ]);

        // Fetch tag names
        const topTags = [];
        for (const stat of tagStats) {
            const tag = await prisma.supportTicketTag.findUnique({ where: { id: stat.tagId } });
            if (tag) {
                topTags.push({ name: tag.name, count: stat._count.tagId });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ticketVolume: totalTickets,
                activeTickets: openTickets,
                resolvedTickets: resolvedTickets,
                resolutionRate: totalTickets ? ((resolvedTickets / totalTickets) * 100).toFixed(2) + '%' : '0%',
                slaBreachCount: breachedSLAs,
                topTags
            }
        });
    } catch (error: any) {
        console.error('Fetch Support Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics.' }, { status: 500 });
    }
}
