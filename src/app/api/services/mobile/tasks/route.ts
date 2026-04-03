import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Retrieve pending/in-progress service orders
        let tasks = await prisma.serviceOrder.findMany({
            where: {
                tenantId: session.tenantId !== 'PLATFORM_ADMIN' ? session.tenantId : undefined,
                status: {
                    in: ['PENDING', 'IN_PROGRESS']
                }
            },
            include: {
                customer: {
                    select: { name: true, city: true, district: true, phone: true }
                },
                asset: {
                    select: { brand: true, primaryIdentifier: true, secondaryIdentifier: true }
                }
            },
            orderBy: {
                appointmentDate: 'asc'
            },
            take: 20
        });

        // EĞER staffId diye bir ilişki schema üzerinde kuruluysa ve biz güncellersek 
        // sonradan buraya where: { staffId: staff.id } eklenebilir. 
        // Ancak şu an tüm açık görevler "Saha Görev Havuzunda" toplanmış gibi sıralıyoruz.

        // Null olan appointmentDate'leri en tepeye almak veya ayırmak için basit sıralama:
        tasks = tasks.sort((a, b) => {
            if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
            if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
            return 0;
        });

        return NextResponse.json({ tasks });
    } catch (error: any) {
        console.error('Service tasks fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
