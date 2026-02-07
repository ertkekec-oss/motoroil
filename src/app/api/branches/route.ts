
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { id: 'asc' }
        });
        return NextResponse.json({ success: true, branches });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validation
        if (!body.name) {
            return NextResponse.json({ success: false, error: 'Şube adı zorunludur' }, { status: 400 });
        }

        const newBranch = await prisma.branch.create({
            data: {
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
