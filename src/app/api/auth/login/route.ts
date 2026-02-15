import { NextResponse } from 'next/server';
import { prismaBase as prisma } from '@/lib/prismaBase';
import { comparePassword, createSession, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = body.username?.toLowerCase().trim();
        const password = body.password;
        const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';

        // 1. Brute Force Protection: Check failed attempts in last 15 mins
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const failedAttempts = await prisma.loginAttempt.count({
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

        // 1. Search in Staff
        let targetUser = await prisma.staff.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ],
                deletedAt: null
            }
        });

        let foundInStaff = false;

        if (targetUser) {
            foundInStaff = true;
            // Respect existing tenantId if set (e.g. for tenant-level staff), otherwise default to PLATFORM_ADMIN
            (targetUser as any).tenantId = targetUser.tenantId || 'PLATFORM_ADMIN';
        }

        // 2. Search in User if not found in Staff
        if (!targetUser) {
            targetUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: username }
                    ]
                },
                include: {
                    tenant: {
                        select: {
                            setupState: true
                        }
                    },
                    accessibleCompanies: {
                        take: 1
                    }
                }
            }) as any; // Cast for user to allow mixed type usage below

            // Adapt User object to look like Staff for the rest of logic if needed
            if (targetUser) {
                if (!targetUser.username) targetUser.username = (targetUser as any).email;
                (targetUser as any).setupState = (targetUser as any).tenant?.setupState || 'PENDING';
                if ((targetUser as any).accessibleCompanies?.length > 0) {
                    (targetUser as any).companyId = (targetUser as any).accessibleCompanies[0].companyId;
                    // Dont degrade SUPER_ADMIN role
                    if ((targetUser as any).role !== 'SUPER_ADMIN') {
                        (targetUser as any).role = (targetUser as any).accessibleCompanies[0].role;
                    }
                }
            }
        }

        if (!targetUser) {
            // Record failed attempt
            await prisma.loginAttempt.create({ data: { ip, username, success: false } });
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, targetUser.password);

        if (!isMatch) {
            // Record failed attempt
            await prisma.loginAttempt.create({ data: { ip, username, success: false } });
            return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
        }

        // Record successful attempt
        await prisma.loginAttempt.create({ data: { ip, username, success: true } });

        // Auto-migration: If password was plain text, hash it now
        if (!targetUser.password.startsWith('$2')) {
            const hashed = await hashPassword(password);
            if (foundInStaff) {
                await prisma.staff.update({
                    where: { id: targetUser.id },
                    data: { password: hashed }
                });
            } else {
                await prisma.user.update({
                    where: { id: targetUser.id },
                    data: { password: hashed }
                });
            }
        }

        // Create secure session cookie
        await createSession(targetUser);

        // Log login activity
        await logActivity({
            tenantId: targetUser.tenantId || 'PLATFORM_ADMIN',
            userId: targetUser.id,
            userName: targetUser.username,
            action: 'LOGIN',
            entity: 'User',
            entityId: targetUser.id,
            details: 'Sisteme giriş yapıldı.',
            ipAddress: ip,
            userAgent: request.headers.get('user-agent') || undefined,
            branch: (targetUser as any).branch || 'Merkez'
        });

        // Return user data (safely)
        return NextResponse.json({
            id: targetUser.id,
            username: targetUser.username,
            role: targetUser.role || 'Personel',
            branch: (targetUser as any).branch || 'Merkez',
            name: targetUser.name,
            tenantId: targetUser.tenantId || 'PLATFORM_ADMIN',
            permissions: (targetUser as any).permissions || [],
            setupState: (targetUser as any).setupState || 'COMPLETED'
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Giriş işlemi sırasında bir hata oluştu' }, { status: 500 });
    }
}
