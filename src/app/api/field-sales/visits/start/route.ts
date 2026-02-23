
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => d * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng1 - lng2); // Fixed longitude diff direction (doesn't change result but cleaner)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { routeStopId, customerId, location } = body;

        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

        // 1. Staff
        let staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    { username: session.user.username || session.user.email }
                ]
            }
        });
        if (!staff && session.tenantId === 'PLATFORM_ADMIN') staff = await (prisma as any).staff.findFirst();
        if (!staff) return NextResponse.json({ error: 'Personel kaydı bulunamadı.' }, { status: 403 });

        // 2. Resolve Company
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({ where: { tenantId: session.tenantId } });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        // 3. Fetch Settings
        const settingsRecord = await prisma.appSettings.findUnique({
            where: { companyId_key: { companyId: company.id, key: 'field_sales_config' } }
        });
        const config = (settingsRecord?.value as any) || { maxDistance: 1500, allowOutOfRange: true };
        const MAX_RANGE = config.maxDistance || 1500;
        const ALLOW_OUT_OF_RANGE = config.allowOutOfRange !== false;

        // 4. Active visit check
        const activeVisit = await (prisma as any).salesVisit.findFirst({
            where: { staffId: staff.id, checkOutTime: null },
            include: { customer: { select: { name: true } } }
        });
        if (activeVisit) {
            return NextResponse.json({
                error: `Zaten aktif bir ziyaretiniz var: ${activeVisit.customer?.name}`,
                activeVisitId: activeVisit.id
            }, { status: 409 });
        }

        // 5. Customer & Pinning Logic
        const customer = await (prisma as any).customer.findUnique({
            where: { id: customerId },
            select: { id: true, lat: true, lng: true }
        });
        if (!customer) return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });

        let isOutOfRange = false;
        let distanceMeters: number | null = null;
        let pinnedNow = false;

        if (location?.lat && location?.lng) {
            if (!customer.lat || !customer.lng) {
                // Auto-pin remains for the VERY FIRST time. 
                // Any subsequent change will be via Request.
                await (prisma as any).customer.update({
                    where: { id: customerId },
                    data: { lat: location.lat, lng: location.lng, locationPinnedAt: new Date() }
                });
                pinnedNow = true;
                distanceMeters = 0;
            } else {
                distanceMeters = Math.round(haversineMeters(location.lat, location.lng, customer.lat, customer.lng));
                isOutOfRange = distanceMeters > MAX_RANGE;
            }
        }

        // 6. Block if out of range and not allowed
        if (isOutOfRange && !ALLOW_OUT_OF_RANGE) {
            return NextResponse.json({
                error: `Kapsam dışındasınız (${distanceMeters}m). Bu firma için kapsam dışı ziyaretlere izin verilmiyor.`,
                distanceMeters
            }, { status: 403 });
        }

        const visit = await (prisma as any).salesVisit.create({
            data: {
                companyId: company.id,
                staffId: staff.id,
                customerId,
                routeStopId,
                checkInTime: new Date(),
                checkInLocation: { ...location, distanceMeters, autoPinned: pinnedNow },
                isOutOfRange
            }
        });

        return NextResponse.json({ ...visit, distanceMeters, isOutOfRange, autoPinned: pinnedNow });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
