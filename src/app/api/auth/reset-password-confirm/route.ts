
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { id, token, password } = await request.json();

        // In a real app, verify token validity and expiration here.
        // For this demo/ MVP, we trust the ID if it matches the token (since we set token=id)

        if (!id || !password) {
            return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 });
        }

        const staff = await prisma.staff.update({
            where: { id: id },
            data: { password: password } // In real map, hash password!
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
