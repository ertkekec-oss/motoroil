import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const user = (auth as any).user;
        const companyId = user.companyId || user.tenantId;

        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const maintenances = await prisma.assetMaintenance.findMany({
            where: { companyId },
            include: { asset: true },
            orderBy: { maintenanceDate: 'desc' }
        });

        return NextResponse.json({ success: true, data: maintenances });
    } catch (error) {
        console.error('API Error - GET Maintenances:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const user = (auth as any).user;
        const companyId = user.companyId || user.tenantId;

        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assetId, maintenanceDate, type, cost, description, nextMaintenanceDate } = body;

        if (!assetId) {
            return NextResponse.json({ error: 'Asset ID zorunludur' }, { status: 400 });
        }

        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) return NextResponse.json({ error: 'Demirbaş bulunamadı' }, { status: 404 });

        // İşlemleri Transaction içinde yapalım
        const result = await prisma.$transaction(async (tx) => {
            const maintenance = await tx.assetMaintenance.create({
                data: {
                    companyId,
                    assetId,
                    maintenanceDate: maintenanceDate ? new Date(maintenanceDate) : new Date(),
                    type: type || 'REPAIR',
                    cost: cost ? Number(cost) : 0,
                    description: description || ''
                },
                include: { asset: true }
            });

            // Eğer bir SONRAKİ BAKIM tarihi girildiyse -> Global Task (Takvim) entegrasyonu!
            if (nextMaintenanceDate) {
                const due = new Date(nextMaintenanceDate);
                await tx.globalTask.create({
                    data: {
                        companyId,
                        title: `Yaklaşan Bakım/Periyot: ${asset.name}`,
                        description: `Varlık: ${asset.name} (SN: ${asset.serialNumber})\nTür: ${type}\nGeçmiş Bakım Notu: ${description}`,
                        type: 'TASK',
                        status: 'PENDING',
                        priority: 'HIGH',
                        dueDate: due,
                        startTime: due,
                        endTime: due,
                        isAllDay: true,
                        relatedEntityType: 'Asset', // Extension for referencing
                        relatedEntityId: asset.id
                    }
                });
            }

            return maintenance;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('API Error - POST Maintenance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
