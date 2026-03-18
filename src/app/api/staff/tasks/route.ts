import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(req: Request) {
    try {
        const headersList = await headers();
        let tenantId = headersList.get('x-tenant-id');

        if (!tenantId) {
            // For development fallback or domain resolution logic
            const host = headersList.get('host') || '';
            const subdomain = host.split('.')[0];
            const tenant = await prisma.tenant.findUnique({
                where: { b2bCustomDomain: subdomain }
            });
            tenantId = tenant ? tenant.id : 'PLATFORM_ADMIN';
        }

        const url = new URL(req.url);
        const staffId = url.searchParams.get('staffId');
        const mine = url.searchParams.get('mine');

        const where: any = { tenantId };

        if (mine === 'true') {
            const { getSession, getStaffIdFromSession } = await import('@/lib/auth');
            const sessionResult: any = await getSession();
            const session = sessionResult?.user || sessionResult;
            if (session) {
                const resolvedId = await getStaffIdFromSession(session);
                if (resolvedId) where.staffId = resolvedId;
            }
        } else if (staffId) {
            where.staffId = staffId;
        }

        const tasks = await prisma.staffTask.findMany({
            where,
            include: {
                staff: {
                    select: { name: true, role: true }
                },
                feedbacks: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Etkinlikler getirilirken hata oluştu' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const headersList = await headers();
        let tenantId = headersList.get('x-tenant-id');

        if (!tenantId) {
            const host = headersList.get('host') || '';
            const subdomain = host.split('.')[0];
            const tenant = await prisma.tenant.findUnique({
                where: { b2bCustomDomain: subdomain }
            });
            tenantId = tenant ? tenant.id : 'PLATFORM_ADMIN';
        }

        const data = await req.json();

        if (!data.staffId || !data.title) {
            return NextResponse.json({ error: 'Personel ve Görev Başlığı zorunludur' }, { status: 400 });
        }

        const task = await prisma.staffTask.create({
            data: {
                tenantId,
                staffId: data.staffId,
                title: data.title,
                description: data.description || null,
                priority: data.priority || 'Orta',
                status: 'Bekliyor',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            }
        });

        // Also update the Staff's currentJob if it's high priority or we want it to be their active job
        await prisma.staff.update({
            where: { id: data.staffId },
            data: { 
                currentJob: data.title, 
                status: 'Meşgul' 
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Görev oluşturulurken hata oluştu' }, { status: 500 });
    }
}
