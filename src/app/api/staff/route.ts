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
        const {
            name, role, salary, branch, phone, email, type, username, companyId,
            birthDate, maritalStatus, bloodType, militaryStatus, reference,
            hasDriverLicense, educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address
        } = body;

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
                companyId: companyId || user.companyId,
                address,
                city,
                district,
                birthDate: birthDate ? new Date(birthDate) : null,
                maritalStatus,
                bloodType,
                militaryStatus,
                educationLevel,
                hasDriverLicense: !!hasDriverLicense,
                reference,
                relativeName,
                relativePhone,
                healthReport,
                certificate,
                notes
            }
        });

        return NextResponse.json({ success: true, staff: newStaff });
    } catch (error: any) {
        console.error('[Staff API POST Error]:', error);

        // Handle Unique Constraint (already exists)
        if (error.code === 'P2002') {
            return NextResponse.json({
                success: false,
                error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda.'
            }, { status: 400 });
        }

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
        const {
            id, name, email, phone, role, salary, branch, type,
            birthDate, maritalStatus, bloodType, militaryStatus, reference,
            hasDriverLicense, educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address
        } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID zorunludur' }, { status: 400 });

        const updateData: any = {
            name, email, phone, role, branch, type,
            maritalStatus, bloodType, militaryStatus, reference,
            educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address,
            hasDriverLicense: hasDriverLicense !== undefined ? !!hasDriverLicense : undefined
        };

        if (salary !== undefined) updateData.salary = parseFloat(salary);
        if (birthDate) updateData.birthDate = new Date(birthDate);

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, staff: updatedStaff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
