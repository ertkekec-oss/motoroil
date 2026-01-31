import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all settings
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const settings = await prisma.appSettings.findMany();

        // Convert array to object map for easier consumption { "key": "value" }
        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json(settingsMap);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE settings
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        // CRITICAL: Check server-side permission
        if (!hasPermission(session, 'settings_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        // Body should be an object like { "notification_on_delete": true, "notification_on_approval": false }

        const updates = Object.keys(body).map(key => {
            return prisma.appSettings.upsert({
                where: { key: key },
                update: { value: body[key] },
                create: { key: key, value: body[key] }
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
