import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    // Strict Tenant Isolation for GET
    const where: any = {
        deletedAt: null,
        tenantId: auth.user.tenantId || 'PLATFORM_ADMIN'
    };

    if (branch && branch !== 'all') {
        where.branch = branch;
    }

    try {
        const staff = await prisma.staff.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ success: true, staff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();

        const { name, role, salary, branch, phone, email, type, username, companyId } = body;

        // Basic validation
        if (!name) return NextResponse.json({ success: false, error: 'İsim zorunludur' }, { status: 400 });

        const newStaff = await prisma.staff.create({
            data: {
                username: username || email || `user${Date.now()}`,
                name,
                phone,
                role: role || 'Personel',
                salary: parseFloat(salary) || 17002,
                branch: branch || 'Merkez',
                email,
                type: type || 'service',
                tenantId: auth.user.tenantId || 'PLATFORM_ADMIN',
                companyId: companyId || auth.user.companyId
            }
        });

        return NextResponse.json({ success: true, staff: newStaff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID zorunludur' }, { status: 400 });

        // Convert numeric fields if they exist
        if (data.salary) data.salary = parseFloat(data.salary);
        if (data.age) data.age = parseInt(data.age);

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data
        });

        return NextResponse.json({ success: true, staff: updatedStaff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
