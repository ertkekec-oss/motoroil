import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const order = await prisma.serviceOrder.findUnique({
            where: { id: params.id, companyId },
            include: {
                customer: true,
                asset: true,
                items: {
                    include: { technician: { select: { name: true } } }
                }
            }
        });

        if (!order) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 });

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const companyId = await resolveCompanyId(auth.user);

        const body = await request.json();
        
        let dataToUpdate: any = {};
        if (body.status) dataToUpdate.status = body.status;
        
        const updated = await prisma.serviceOrder.update({
            where: { id: params.id, companyId },
            data: dataToUpdate
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
