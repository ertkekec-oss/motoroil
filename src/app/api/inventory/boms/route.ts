import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant bilgisi bulunamadı' }, { status: 400 });
        }

        const whereClause: any = { tenantId };
        if (companyId) {
            whereClause.companyId = companyId;
        }

        const boms = await prisma.bom.findMany({
            where: whereClause,
            include: {
                product: {
                    select: { name: true, code: true, unit: true, imageUrl: true }
                },
                items: {
                    include: {
                        product: {
                            select: { name: true, code: true, unit: true, price: true, buyPrice: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, boms });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant bilgisi bulunamadı' }, { status: 400 });
        }

        let company;
        if (companyId) {
            company = await prisma.company.findUnique({ where: { id: companyId } });
        } else {
            company = await prisma.company.findFirst({ where: { tenantId } });
        }

        if (!company) {
            return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
        }

        const body = await request.json();
        const { productId, name, code, description, estimatedCost, items } = body;

        if (!productId || !items || !items.length) {
            return NextResponse.json({ error: 'Hedef ürün ve hammadde kalemleri zorunludur' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const bom = await tx.bom.create({
                data: {
                    companyId: company.id,
                    tenantId: tenantId,
                    productId,
                    name: name || '',
                    code,
                    description,
                    estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
                    isActive: true,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: parseFloat(item.quantity) || 1,
                            unit: item.unit || 'Adet',
                            wastePercentage: item.wastePercentage ? parseFloat(item.wastePercentage) : 0
                        }))
                    }
                },
                include: {
                    product: true,
                    items: { include: { product: true } }
                }
            });

            return bom;
        });

        return NextResponse.json({ success: true, bom: result });

    } catch (error: any) {
        console.error('BOM creation error:', error);
        let errorMessage = error.message;
        if (error.code === 'P2002') {
            errorMessage = 'Bu Reçete numarası (kodu) zaten sistemde kayıtlı. Lütfen benzersiz bir kod girin.';
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: error.code === 'P2002' ? 400 : 500 });
    }
}
