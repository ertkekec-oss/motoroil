import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shipmentSyncQueue } from '@/queues/shipmentQueue';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        // Require Bearer token matching CRON_SECRET if it is configured in the environment
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const pendingShipments = await prisma.shipment.findMany({
            where: {
                status: {
                    in: ['LABEL_CREATED', 'IN_TRANSIT']
                },
                mode: 'INTEGRATED',
                trackingNumber: {
                    not: null
                }
            },
            take: 200,
            select: {
                id: true,
                trackingNumber: true,
                carrierCode: true
            }
        });

        if (pendingShipments.length === 0) {
            return NextResponse.json({ ok: true, queued: 0 });
        }

        const jobs = pendingShipments.map(shp => ({
            name: `sync-${shp.trackingNumber}`,
            data: {
                trackingNumber: shp.trackingNumber!,
                carrierCode: shp.carrierCode,
                shipmentId: shp.id
            }
        }));

        await shipmentSyncQueue.addBulk(jobs);

        return NextResponse.json({ ok: true, queued: jobs.length });

    } catch (e: any) {
        console.error('Shipment Sync Cron Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
