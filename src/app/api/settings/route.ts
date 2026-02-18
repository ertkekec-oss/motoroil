import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const settings = await prisma.appSettings.findMany({
            where: { companyId }
        });

        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json(settingsMap);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        if (!hasPermission(session, 'settings_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();

        const updates = Object.keys(body).map(key => {
            return prisma.appSettings.upsert({
                where: { companyId_key: { companyId, key } },
                update: { value: body[key] },
                create: { companyId, key, value: body[key] }
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
