import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, addDays, subDays } from "date-fns";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerCompanyId = auth.user.companyId;
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const cursor = searchParams.get("cursor");
    const take = parseInt(searchParams.get("take") || "20", 10);

    const whereClause: any = { sellerCompanyId };

    if (statusParam) {
        // Handle comma-separated statuses if needed, or exact match
        if (statusParam.includes(",")) {
            whereClause.status = { in: statusParam.split(",") };
        } else {
            whereClause.status = statusParam;
        }
    }

    const queryArgs: any = {
        where: whereClause,
        take: take > 50 ? 50 : take,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: {
            shipment: { select: { networkOrderId: true } }
        }
    };

    if (cursor) {
        queryArgs.cursor = { id: cursor };
        queryArgs.skip = 1; // Skip the cursor
    }

    try {
        const [earnings, pendingAggr, next7dAggr, last30dAggr, releasedAggr] = await Promise.all([
            prisma.sellerEarning.findMany(queryArgs),
            // pending Net total
            prisma.sellerEarning.aggregate({
                where: { sellerCompanyId, status: { in: ["PENDING", "CLEARED"] } },
                _sum: { netAmount: true }
            }),
            // releasing next 7 days
            prisma.sellerEarning.aggregate({
                where: {
                    sellerCompanyId,
                    status: "CLEARED",
                    expectedClearDate: {
                        gte: new Date(),
                        lte: addDays(new Date(), 7)
                    }
                },
                _sum: { netAmount: true }
            }),
            // released last 30 days
            prisma.sellerEarning.aggregate({
                where: {
                    sellerCompanyId,
                    status: "RELEASED",
                    releasedAt: { gte: subDays(new Date(), 30) }
                },
                _sum: { netAmount: true }
            }),
            // avg release time
            prisma.sellerEarning.findMany({
                where: { sellerCompanyId, status: "RELEASED" },
                select: { createdAt: true, releasedAt: true },
                take: 100, // sample last 100 for avg
                orderBy: { releasedAt: "desc" }
            })
        ]);

        let sumHours = 0;
        let count = 0;
        for (const er of releasedAggr) {
            if (er.releasedAt && er.createdAt) {
                sumHours += (er.releasedAt.getTime() - er.createdAt.getTime()) / (1000 * 60 * 60);
                count++;
            }
        }
        const avgReleaseTimeHours = count > 0 ? sumHours / count : 0;

        const nextCursor = earnings.length === queryArgs.take ? earnings[earnings.length - 1].id : null;

        return NextResponse.json({
            kpis: {
                pendingNetTotal: pendingAggr._sum.netAmount || 0,
                releasingNext7dNetTotal: next7dAggr._sum.netAmount || 0,
                releasedLast30dNetTotal: last30dAggr._sum.netAmount || 0,
                avgReleaseTimeHours
            },
            page: {
                items: earnings.map(e => ({
                    id: e.id,
                    createdAt: e.createdAt,
                    releasedAt: e.releasedAt,
                    expectedClearDate: e.expectedClearDate,
                    status: e.status,
                    grossAmount: e.grossAmount,
                    commissionAmount: e.commissionAmount,
                    netAmount: e.netAmount,
                    reference: { orderId: e.shipment?.networkOrderId }
                })),
                nextCursor
            }
        });
    } catch (e: any) {
        console.error("Network Earnings API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
