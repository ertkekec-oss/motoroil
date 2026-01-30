import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Find staff member by username
        const staff = await prisma.staff.findUnique({
            where: { username }
        });

        if (!staff || staff.password !== password) {
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        // Return user data (safely)
        return NextResponse.json({
            username: staff.username,
            role: staff.role || 'Personel',
            branch: staff.branch || 'Merkez',
            name: staff.name,
            permissions: staff.permissions || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
