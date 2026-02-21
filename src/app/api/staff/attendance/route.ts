import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const staffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {};
        if (staffId) where.staffId = staffId;
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const attendance = await (prisma as any).attendance.findMany({
            where,
            include: { staff: { select: { name: true, role: true } } },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(attendance);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { staffId, type, location, deviceInfo, notes } = body; // type: 'CHECK_IN' | 'CHECK_OUT'

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (type === 'CHECK_IN') {
            // Check if already checked in today
            const existing = await (prisma as any).attendance.findFirst({
                where: {
                    staffId,
                    date: { gte: today }
                }
            });

            if (existing) {
                return NextResponse.json({ error: 'Bugün için zaten giriş yapılmış.' }, { status: 400 });
            }

            const newRecord = await (prisma as any).attendance.create({
                data: {
                    staffId,
                    date: new Date(),
                    checkIn: new Date(),
                    locationIn: location,
                    deviceInfo,
                    notes,
                    status: 'ON_TIME' // Logic to compare with shift can be added
                }
            });
            return NextResponse.json(newRecord);

        } else if (type === 'CHECK_OUT') {
            const record = await (prisma as any).attendance.findFirst({
                where: {
                    staffId,
                    date: { gte: today },
                    checkOut: null
                }
            });

            if (!record) {
                return NextResponse.json({ error: 'Giriş kaydı bulunamadı veya zaten çıkış yapılmış.' }, { status: 400 });
            }

            const checkOutTime = new Date();
            const diffMs = checkOutTime.getTime() - record.checkIn.getTime();
            const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            const updatedRecord = await (prisma as any).attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: checkOutTime,
                    locationOut: location,
                    workingHours
                }
            });
            return NextResponse.json(updatedRecord);
        }

        return NextResponse.json({ error: 'Geçersiz işlem tipi.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
