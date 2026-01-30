
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const staff = await prisma.staff.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const staff = await prisma.staff.create({
            data: {
                name: data.name,
                role: data.role,
                branch: data.branch,
                type: data.type,
                status: data.status || 'Boşta',
                permissions: data.permissions || [],
            }
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        const staff = await prisma.staff.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.staff.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
