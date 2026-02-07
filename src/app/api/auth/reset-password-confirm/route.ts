import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { id, token, type, password } = await request.json();

        // In a real app, verify token validity and expiration here.
        // For this demo/ MVP, we trust the ID if it matches the token
        if (!id || !token || !password || id !== token) {
            return NextResponse.json({ error: 'Geçersiz veya eksik bilgi.' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        if (type === 'USER') {
            await (prisma as any).user.update({
                where: { id: id },
                data: { password: hashedPassword }
            });
        } else {
            await (prisma as any).staff.update({
                where: { id: id },
                data: { password: hashedPassword }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Reset Password Confirm Error:", error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
