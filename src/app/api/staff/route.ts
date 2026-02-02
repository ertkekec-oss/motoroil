import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const where: any = { deletedAt: null };
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

        const { name, role, salary, branch, phone, email, type } = body;

        // Basic validation
        if (!name) return NextResponse.json({ success: false, error: 'İsim zorunludur' }, { status: 400 });

        const newStaff = await prisma.staff.create({
            data: {
                username: email || `user${Date.now()}`, // Temporary username generation
                name,
                role: role || 'Personel',
                salary: parseFloat(salary) || 17002,
                branch: branch || 'Merkez',
                email,
                type: type || 'service',
                // other fields default
            }
        });

        return NextResponse.json({ success: true, staff: newStaff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
