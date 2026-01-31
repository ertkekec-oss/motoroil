import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Find staff member by username OR email
        const staff = await prisma.staff.findFirst({
            where: {
                OR: [
                    { username: username }, // Assume input 'username' can be email too
                    { email: username }
                ]
            }
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
