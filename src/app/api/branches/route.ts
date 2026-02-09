import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        // Resolve Company
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company) {
            return NextResponse.json({ success: true, branches: [] });
        }

        const branches = await prisma.branch.findMany({
            where: { companyId: company.id },
            orderBy: { id: 'asc' }
        });
        return NextResponse.json({ success: true, branches });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const body = await request.json();

        // Validation
        if (!body.name) {
            return NextResponse.json({ success: false, error: 'Şube adı zorunludur' }, { status: 400 });
        }

        // Resolve Company
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 400 });
        }

        const newBranch = await prisma.branch.create({
            data: {
                companyId: company.id,
                name: body.name,
                type: body.type || 'Şube',
                city: body.city,
                district: body.district,
                address: body.address,
                phone: body.phone,
                manager: body.manager,
                status: body.status || 'Aktif'
            }
        });

        return NextResponse.json({ success: true, branch: newBranch });

    } catch (error: any) {
        // Unique constraint violation check
        if (error.code === 'P2002') {
            return NextResponse.json({ success: false, error: 'Bu isimde bir şube zaten var.' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
