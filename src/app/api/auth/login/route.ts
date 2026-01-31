import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSession, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Find staff member by username OR email
        const staff = await prisma.staff.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (!staff) {
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, staff.password);

        if (!isMatch) {
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        // Auto-migration: If password was plain text, hash it now
        if (!staff.password.startsWith('$2')) {
            const hashed = await hashPassword(password);
            await prisma.staff.update({
                where: { id: staff.id },
                data: { password: hashed }
            });
        }

        // Create secure session cookie
        await createSession(staff);

        // Return user data (safely)
        return NextResponse.json({
            username: staff.username,
            role: staff.role || 'Personel',
            branch: staff.branch || 'Merkez',
            name: staff.name,
            permissions: staff.permissions || []
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Giriş işlemi sırasında bir hata oluştu' }, { status: 500 });
    }
}
