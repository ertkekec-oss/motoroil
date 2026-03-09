import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { PlatformDoctorService } from '@/services/infrastructure/PlatformDoctorService';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    const isPlatformAdmin = auth.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN'].includes(role || '') && !isPlatformAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        const statusObj = await PlatformDoctorService.getPlatformStatus(tenantId);
        return NextResponse.json({ success: true, ...statusObj });
    } catch (error: any) {
        console.error('Fetch Platform Doctor Status Error:', error);
        return NextResponse.json({ error: 'Failed to fetch platform status.' }, { status: 500 });
    }
}
