import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    // Strict Tenant Isolation for GET
    const user = auth.user;
    const isPlatformAdmin = user.tenantId === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';
    const effectiveTenantId = user.impersonateTenantId || user.tenantId;

    const where: any = {
        deletedAt: null
    };

    // If not platform admin, or if platform admin is impersonating, filter by tenant
    if (!isPlatformAdmin || user.impersonateTenantId) {
        where.tenantId = effectiveTenantId;
    }

    if (branch && branch !== 'all') {
        where.branch = branch;
    }

    try {
        const staff = await prisma.staff.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        // Ensure salary is number
        const formattedStaff = staff.map(s => ({
            ...s,
            salary: s.salary ? Number(s.salary) : 0
        }));

        return NextResponse.json({ success: true, staff: formattedStaff });
    } catch (error: any) {
        console.error('[Staff API GET Error]:', error);
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

        const user = auth.user;
        const effectiveTenantId = user.impersonateTenantId || user.tenantId || 'PLATFORM_ADMIN';

        const newStaff = await prisma.staff.create({
            data: {
                username: username || email || `user${Date.now()}`,
                name,
                phone,
                role: role || 'Personel',
                salary: salary ? Number(salary) : 17002,
                branch: branch || 'Merkez',
                email,
                type: type || 'service',
                tenantId: effectiveTenantId,
                companyId: companyId || user.companyId
            }
        });

        return NextResponse.json({ success: true, staff: newStaff });
    } catch (error: any) {
        console.error('[Staff API POST Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'ID zorunludur' }, { status: 400 });

        const user = auth.user;
        const isPlatformAdmin = user.tenantId === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';

        // Soft delete
        await prisma.staff.update({
            where: {
                id,
                // Security: Ensure user belongs to same tenant unless platform admin
                tenantId: isPlatformAdmin ? undefined : user.tenantId
            },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Staff API DELETE Error]:', error);
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
