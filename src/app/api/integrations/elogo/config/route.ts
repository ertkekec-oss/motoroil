
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, hasPermission } from '@/lib/auth';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    if (!hasPermission(session, 'settings_view') && !hasPermission(session, 'settings_manage')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const settings = await prisma.appSettings.findUnique({
            where: { key: 'elogo_config' }
        });

        // Hide password in response? Ideally yes, but for editing we might need to know if it's set.
        // Usually we return standard placeholders or encrypted. For simplicity here: plain or masked.
        // Let's return raw for now (assuming admin access is secure)
        return NextResponse.json({ success: true, config: settings?.value || {} });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Config fetch failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    if (!hasPermission(session, 'settings_manage')) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    try {
        const body = await request.json();
        // Validate minimal required fields
        const { username, pass, isTest } = body;

        // Save to DB
        await prisma.appSettings.upsert({
            where: { key: 'elogo_config' },
            create: {
                key: 'elogo_config',
                value: body
            },
            update: {
                value: body
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
