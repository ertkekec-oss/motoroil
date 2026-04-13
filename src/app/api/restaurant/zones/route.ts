import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        // Varsayılan olarak tüm alanları (bölgeleri) ve onların altındaki masaları çekelim.
        // İleride headerdan şirketi çekeceğiz.
        const companyId = "C001"; // Mock veya gerçek auth'tan gelen şirket ID

        const zones = await prisma.restaurantZone.findMany({
            where: { companyId },
            include: {
                tables: {
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(zones);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const companyId = "C001"; // TODO: gerçek auth
        const { name } = body;

        if (!name) return NextResponse.json({ error: "İsim zorunludur" }, { status: 400 });

        const newZone = await prisma.restaurantZone.create({
            data: {
                name,
                companyId
            }
        });

        return NextResponse.json(newZone);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

        await prisma.restaurantZone.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
