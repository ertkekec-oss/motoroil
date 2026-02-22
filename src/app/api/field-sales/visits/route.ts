
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Find Staff linked to this user
        const staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user?.email },
                    { username: session.user?.username || session.user?.email }
                ]
            }
        });

        if (!staff) {
            return NextResponse.json({ visits: [] });
        }

        const visits = await (prisma as any).salesVisit.findMany({
            where: {
                staffId: staff.id
            },
            include: {
                customer: { select: { id: true, name: true, phone: true, city: true } },
                orders: { select: { id: true, total: true } }
            },
            orderBy: {
                checkInTime: 'desc'
            },
            take: 100
        });

        return NextResponse.json({ visits });
    } catch (error: any) {
        console.error('Field visits API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - ziyaret notlarını güncelle
export async function PUT(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id, notes, result } = body;

        if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

        // Staff kontrolü - sadece kendi ziyaretini düzenleyebilsin
        const staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user?.email },
                    { username: session.user?.username || session.user?.email }
                ]
            }
        });

        const visit = await (prisma as any).salesVisit.findFirst({
            where: { id }
        });

        if (!visit) return NextResponse.json({ error: 'Ziyaret bulunamadı' }, { status: 404 });

        // Admin veya kendi ziyareti
        if (staff && visit.staffId !== staff.id && session.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const updated = await (prisma as any).salesVisit.update({
            where: { id },
            data: {
                ...(notes !== undefined ? { notes } : {}),
                ...(result !== undefined ? { result } : {}),
            },
            include: {
                customer: { select: { id: true, name: true, phone: true, city: true } },
                orders: { select: { id: true, total: true } }
            }
        });

        return NextResponse.json({ visit: updated });
    } catch (error: any) {
        console.error('Visit update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
