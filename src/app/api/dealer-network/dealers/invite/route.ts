import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

        let targetEmail = body.email;
        let customerId = body.customerId;

        if (customerId && !targetEmail) {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId }
            });

            if (!customer || !customer.email) {
                return NextResponse.json({ error: 'Seçilen carinin geçerli bir e-posta adresi bulunmuyor.' }, { status: 400 });
            }
            targetEmail = customer.email;
        }

        if (!targetEmail) {
            return NextResponse.json({ error: 'Davetiyeyi göndermek için geçerli bir e-posta adresi gereklidir.' }, { status: 400 });
        }

        // Tenant context operations would happen here...
        console.log(`[Invite] Inviting ${targetEmail} for tenant ${tenantId} by ${user.id}${customerId ? ` (Customer ID: ${customerId})` : ''}`);

        return NextResponse.json({ success: true, message: "Davetiye gönderildi." });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
