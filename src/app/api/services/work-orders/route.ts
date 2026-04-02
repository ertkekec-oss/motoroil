import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, assetId, complaint, branch, status, currentKm, chassisNo, productionYear } = body;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
        }

        // Cihaza ait verileri güncelle (varsa)
        if (assetId) {
            try {
                const existing = await prisma.customerAsset.findUnique({ where: { id: assetId } });
                const meta = existing?.metadata ? (typeof existing.metadata === 'object' ? existing.metadata : JSON.parse(existing.metadata as string)) : {};
                await prisma.customerAsset.update({
                    where: { id: assetId },
                    data: {
                        secondaryIdentifier: chassisNo || undefined,
                        productionYear: productionYear ? Number(productionYear) : undefined,
                        metadata: {
                            ...meta,
                            currentKm: currentKm || meta.currentKm
                        }
                    }
                });
            } catch (e) {
                console.error("Asset info update failed:", e);
            }
        }

        const workOrder = await prisma.serviceOrder.create({
            data: {
                companyId: customer.companyId,
                customerId,
                assetId: assetId || null,
                complaint,
                branch: branch || 'Merkez',
                status: status || 'PENDING',
                appointmentDate: new Date(),
                currentKm_or_Use: currentKm ? parseInt(currentKm) : null,
                totalAmount: 0,
                subTotal: 0,
                taxTotal: 0
            }

        });

        return NextResponse.json(workOrder);

    } catch (error: any) {
        console.error('WorkOrder creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
