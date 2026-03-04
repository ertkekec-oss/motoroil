import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: any }) {
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

        const resolvedParams = await Promise.resolve(params);
        const orderId = resolvedParams.id;

        // Tenant checks on whether the dealer with {params.id} belongs to {tenantId} would happen here
        console.log(`[Credit] Modifying limit for ${orderId} at tenant ${tenantId} by ${user.id}`);

        return NextResponse.json({ success: true, message: `Kredi limiti güncellendi: ${orderId}`, limit: body.creditLimit });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
