
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customerId, lat, lng, notes } = body;

        if (!customerId || !lat || !lng) {
            return NextResponse.json({ error: 'Müşteri ve koordinat bilgileri gereklidir.' }, { status: 400 });
        }

        // Find Staff
        let staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    { username: session.user.username || session.user.email }
                ]
            }
        });
        if (!staff) return NextResponse.json({ error: 'Personel bulunamadı.' }, { status: 403 });

        // Resolve Company
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

        // Create Request
        const request = await (prisma as any).customerLocationRequest.create({
            data: {
                customerId,
                staffId: staff.id,
                companyId: company.id,
                requestedLat: lat,
                requestedLng: lng,
                notes: notes || "Konum güncelleme talebi",
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, request });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
