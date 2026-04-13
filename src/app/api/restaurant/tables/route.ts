import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zoneId, name, capacity } = body;

        if (!zoneId || !name) return NextResponse.json({ error: "Alan ID ve İsim zorunludur" }, { status: 400 });

        const newTable = await prisma.restaurantTable.create({
            data: {
                name,
                zoneId,
                capacity: capacity || 4,
                status: "AVAILABLE"
            }
        });

        return NextResponse.json(newTable);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

        await prisma.restaurantTable.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
         const body = await request.json();
         const { id, status, name } = body;

         if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

         const updated = await prisma.restaurantTable.update({
             where: { id },
             data: {
                 ...(status ? { status } : {}),
                 ...(name ? { name } : {})
             }
         });

         return NextResponse.json(updated);
    } catch (e: any) {
         return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
