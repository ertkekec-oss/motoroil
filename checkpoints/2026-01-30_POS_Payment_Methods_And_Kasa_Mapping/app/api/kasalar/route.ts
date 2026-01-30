
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const kasalar = await prisma.kasa.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ success: true, kasalar }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, balance } = body;

        // Check if exists (including inactive)
        const existing = await prisma.kasa.findFirst({
            where: { name }
        });

        if (existing) {
            // If inactive, reactivate it
            if (!existing.isActive) {
                const reactivated = await prisma.kasa.update({
                    where: { id: existing.id },
                    data: {
                        isActive: true,
                        type: type || existing.type,
                        // Don't reset balance, keep history? Or user expects reset?
                        // Let's keep balance as is for integrity, user can do adjustment if needed.
                    }
                });
                return NextResponse.json({ success: true, kasa: reactivated });
            } else {
                return NextResponse.json({ success: false, error: 'Bu isimde bir kasa zaten var.' }, { status: 400 });
            }
        }

        const kasa = await prisma.kasa.create({
            data: {
                name,
                type,
                balance: balance || 0
            }
        });

        return NextResponse.json({ success: true, kasa });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
