import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Create Admin User
        const admin = await prisma.staff.create({
            data: {
                username: data.adminEmail.split('@')[0], // Use email prefix as username
                email: data.adminEmail,
                password: data.adminPassword,
                name: 'System Admin',
                role: 'Admin',
                branch: 'Merkez',
                type: 'office',
                permissions: ['*']
            }
        });

        // 2. Save Company Info as Settings
        await prisma.appSettings.upsert({
            where: { key: 'company_info' },
            update: { value: { name: data.companyName, address: data.companyAddress } },
            create: { key: 'company_info', value: { name: data.companyName, address: data.companyAddress } }
        });

        return NextResponse.json({ success: true, admin: admin.username });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
