import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, verifyWriteAccess } from '@/lib/auth';

export async function PATCH(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const writeCheck = verifyWriteAccess(auth.user);
    if (!writeCheck.authorized) return writeCheck.response;

    try {
        const body = await req.json();
        const { action, customerIds, data } = body;

        if (!Array.isArray(customerIds) || customerIds.length === 0) {
            return NextResponse.json({ success: false, error: 'Müşteri ID listesi boş olamaz.' }, { status: 400 });
        }

        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 404 });
        }

        if (action === 'delete') {
            await prisma.customer.updateMany({
                where: {
                    id: { in: customerIds },
                    companyId: company.id
                },
                data: {
                    deletedAt: new Date()
                }
            });
            return NextResponse.json({ success: true, message: `${customerIds.length} müşteri silindi.` });
        } else if (action === 'update_category') {
            if (!data || !data.categoryClass) {
                 return NextResponse.json({ success: false, error: 'Kategori belirtilmedi.' }, { status: 400 });
            }
            await prisma.customer.updateMany({
                where: {
                    id: { in: customerIds },
                    companyId: company.id
                },
                data: {
                    customerClass: data.categoryClass
                }
            });
            return NextResponse.json({ success: true, message: `${customerIds.length} müşteri sınıfı güncellendi.` });
        } else if (action === 'update_branch') {
            if (!data || !data.branch) {
                 return NextResponse.json({ success: false, error: 'Şube belirtilmedi.' }, { status: 400 });
            }
            await prisma.customer.updateMany({
                where: {
                    id: { in: customerIds },
                    companyId: company.id
                },
                data: {
                    branch: data.branch
                }
            });
            return NextResponse.json({ success: true, message: `${customerIds.length} müşteri şubesi güncellendi.` });
        }

        return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
