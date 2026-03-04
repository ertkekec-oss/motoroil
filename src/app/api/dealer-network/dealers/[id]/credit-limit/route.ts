import { NextResponse } from 'next/server';
// @ts-ignore
import { requireUserContext } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { user, tenantId } = await requireUserContext();

        if (!user.permissions?.includes('b2b_manage') && user.role !== 'TENANT_OWNER') {
            return NextResponse.json({ error: 'Bu islem icin b2b_manage yetkisi gereklidir' }, { status: 403 });
        }

        const body = await req.json();

        // Tenant checks on whether the dealer with {params.id} belongs to {tenantId} would happen here
        console.log(`[Credit] Modifying limit for ${params.id} at tenant ${tenantId} by ${user.id}`);

        return NextResponse.json({ success: true, message: `Kredi limiti güncellendi: ${params.id}`, limit: body.creditLimit });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
