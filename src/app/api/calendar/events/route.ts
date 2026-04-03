import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const tenantId = req.headers.get("x-tenant-id");
        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch ServiceOrders (appointments)
        const serviceOrders = await prisma.serviceOrder.findMany({
            where: {
                companyId: tenantId,
                status: {
                    in: ['PENDING', 'WAITING_APPROVAL', 'IN_PROGRESS']
                }
            },
            include: {
                customer: { select: { name: true } },
                asset: { select: { primaryIdentifier: true, brand: true } }
            }
        });

        // Fetch GlobalTasks
        const globalTasks = await prisma.globalTask.findMany({
            where: {
                companyId: tenantId,
                status: {
                    in: ['PENDING', 'IN_PROGRESS']
                }
            },
            include: {
                assignee: { select: { name: true } }
            }
        });

        // Map them to a unified 'Event' format for the calendar
        const events = [
            ...serviceOrders.map(so => ({
                id: `so_${so.id}`,
                originalId: so.id,
                title: `${so.asset?.primaryIdentifier || 'Araç'} - ${so.customer?.name || 'Müşteri'}`,
                type: 'SERVICE',
                date: so.appointmentDate || null,
                status: so.status,
                assignee: 'Bölge Teknisyeni', // we can map from items if needed
            })),
            ...globalTasks.map(gt => ({
                id: `gt_${gt.id}`,
                originalId: gt.id,
                title: gt.title,
                type: gt.type, // e.g., FINANCE, CRM
                date: gt.startTime || null,
                status: gt.status,
                assignee: gt.assignee?.name || 'Atanmamış',
            }))
        ];

        return NextResponse.json(events);

    } catch (e: any) {
        console.error("Calendar fetch API error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const tenantId = req.headers.get("x-tenant-id");
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, newDate } = body;

        if (!id || !newDate) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        if (id.startsWith('so_')) {
            const originalId = id.replace('so_', '');
            await prisma.serviceOrder.update({
                where: { id: originalId, companyId: tenantId },
                data: { appointmentDate: new Date(newDate) }
            });
        } else if (id.startsWith('gt_')) {
            const originalId = id.replace('gt_', '');
            await prisma.globalTask.update({
                where: { id: originalId, companyId: tenantId },
                data: { startTime: new Date(newDate) }
            });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Calendar update API error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
