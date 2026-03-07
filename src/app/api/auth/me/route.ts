import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.id,
                username: session.username,
                role: session.role || 'Personel',
                branch: (session as any).branch || 'Merkez',
                name: (session as any).name || session.username,
                email: (session as any).email,
                tenantId: (session as any).tenantId || 'PLATFORM_ADMIN',
                permissions: (session as any).permissions || [],
                assignedCategoryIds: (session as any).assignedCategoryIds || [],
                setupState: (session as any).setupState || 'COMPLETED',
                companyId: session.companyId
            }
        });
    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('Dynamic-')) {
            throw error;
        }
        return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
    }
}
