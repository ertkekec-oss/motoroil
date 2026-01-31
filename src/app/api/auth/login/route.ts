import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSession, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';

        // 1. Brute Force Protection: Check failed attempts in last 15 mins
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const failedAttempts = await (prisma as any).loginAttempt.count({
            where: {
                OR: [
                    { ip: ip },
                    { username: username }
                ],
                success: false,
                createdAt: { gte: fifteenMinsAgo }
            }
        });

        if (failedAttempts >= 5) {
            return NextResponse.json({
                error: 'Çok fazla deneme yaptınız. Lütfen 15 dakika bekleyin.'
            }, { status: 429 });
        }

        // Find staff member by username OR email
        const staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ],
                deletedAt: null
            }
        });

        if (!staff) {
            // Record failed attempt
            await (prisma as any).loginAttempt.create({ data: { ip, username, success: false } });
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, staff.password);

        if (!isMatch) {
            // Record failed attempt
            await (prisma as any).loginAttempt.create({ data: { ip, username, success: false } });
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        // Record successful attempt
        await (prisma as any).loginAttempt.create({ data: { ip, username, success: true } });

        // Auto-migration: If password was plain text, hash it now
        if (!staff.password.startsWith('$2')) {
            const hashed = await hashPassword(password);
            await (prisma as any).staff.update({
                where: { id: staff.id },
                data: { password: hashed }
            });
        }

        // Create secure session cookie
        await createSession(staff);

        // Log login activity
        await logActivity({
            userId: staff.id,
            userName: staff.username,
            action: 'LOGIN',
            entity: 'User',
            entityId: staff.id,
            details: 'Sisteme giriş yapıldı.',
            branch: staff.branch || 'Merkez'
        });

        // Return user data (safely)
        return NextResponse.json({
            id: staff.id,
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
