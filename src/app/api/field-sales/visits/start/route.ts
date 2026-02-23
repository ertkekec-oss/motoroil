
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Haversine distance in meters between two lat/lng points
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => d * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Max allowed distance from customer address (meters). No hard block — only flag.
const MAX_RANGE_METERS = 1500;

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { routeStopId, customerId, location } = body;

        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

        // 1. Find Staff
        let staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    { username: session.user.username || session.user.email }
                ]
            }
        });

        if (!staff && session.tenantId === 'PLATFORM_ADMIN') {
            staff = await (prisma as any).staff.findFirst();
        }
        if (!staff) return NextResponse.json({ error: 'Personel kaydı bulunamadı.' }, { status: 403 });

        // 2. Active visit check
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

        // 3. Company
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({ where: { tenantId: session.tenantId } });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        // 4. GPS distance check
        let isOutOfRange = false;
        let distanceMeters: number | null = null;

        if (location?.lat && location?.lng) {
            // Fetch customer's lat/lng if stored, or try geocoding from address
            const customer = await (prisma as any).customer.findUnique({
                where: { id: customerId },
                select: { lat: true, lng: true, address: true, city: true, district: true }
            });

            if (customer?.lat && customer?.lng) {
                distanceMeters = Math.round(haversineMeters(location.lat, location.lng, customer.lat, customer.lng));
                isOutOfRange = distanceMeters > MAX_RANGE_METERS;
            }
        }

        // 5. Create Visit — store lat/lng separately inside location JSON for fast access
        const locationPayload = location
            ? {
                lat: location.lat,
                lng: location.lng,
                accuracy: location.accuracy || null,
                timestamp: new Date().toISOString(),
                distanceMeters
            }
            : {};

        const visit = await (prisma as any).salesVisit.create({
            data: {
                companyId: company.id,
                staffId: staff.id,
                customerId,
                routeStopId,
                checkInTime: new Date(),
                checkInLocation: locationPayload,
                isOutOfRange
            }
        });

        return NextResponse.json({
            ...visit,
            distanceMeters,
            isOutOfRange,
            warning: isOutOfRange
                ? `Uyarı: Müşteri konumuna ${distanceMeters}m uzaktasınız (max ${MAX_RANGE_METERS}m).`
                : null
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
