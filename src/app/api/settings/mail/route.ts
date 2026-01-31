
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.appSettings.findUnique({
            where: { key: 'smtp_settings' }
        });
        return NextResponse.json(settings?.value || {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // data format: { email, password }
        const settings = await prisma.appSettings.upsert({
            where: { key: 'smtp_settings' },
            create: {
                key: 'smtp_settings',
                value: data
            },
            update: {
                value: data
            }
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
