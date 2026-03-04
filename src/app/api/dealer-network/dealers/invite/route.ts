import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && user.role !== 'TENANT_OWNER') {
            return NextResponse.json({ error: 'Bu islem icin b2b_manage yetkisi gereklidir' }, { status: 403 });
        }

        const body = await req.json();

        // Tenant context operations would happen here...
        console.log(`[Invite] Inviting ${body.email} for tenant ${tenantId} by ${user.id}`);

        return NextResponse.json({ success: true, message: "Davetiye gönderildi." });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
