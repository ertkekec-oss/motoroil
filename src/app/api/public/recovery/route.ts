
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        const hashedPassword = await hashPassword('admin123');

        const admin = await (prisma as any).staff.upsert({
            where: { username: 'admin' },
            update: {
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                permissions: ['*']
            },
            create: {
                username: 'admin',
                password: hashedPassword,
                name: 'Sistem Yöneticisi',
                role: 'SUPER_ADMIN',
                branch: 'Merkez',
                permissions: ['*'],
                status: 'Aktif'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Admin account recovery successful',
            user: admin.username
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
