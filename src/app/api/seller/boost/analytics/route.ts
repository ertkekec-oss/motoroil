import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const minus7Str = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const minus30Str = format(subDays(new Date(), 30), "yyyy-MM-dd");

    try {
        const [todayUsage, last7dUsage, last30dUsage, series] = await Promise.all([
            prisma.boostUsageDaily.aggregate({
                where: { sellerTenantId: auth.user.companyId, day: todayStr },
                _sum: { sponsoredImpressions: true }
            }),
            prisma.boostUsageDaily.aggregate({
                where: { sellerTenantId: auth.user.companyId, day: { gte: minus7Str } },
                _sum: { sponsoredImpressions: true }
            }),
            prisma.boostUsageDaily.aggregate({
                where: { sellerTenantId: auth.user.companyId, day: { gte: minus30Str } },
                _sum: { sponsoredImpressions: true }
            }),
            prisma.boostUsageDaily.findMany({
                where: { sellerTenantId: auth.user.companyId, day: { gte: minus30Str } },
                select: { day: true, sponsoredImpressions: true },
                orderBy: { day: "asc" }
            })
        ]);

        // Attempting to group by listingId directly is tricky with Prisma raw queries safely, 
        // we will fetch recent impressions and group them in memory for the top listings demo since it's a readout.
        // For production, a materialized view or custom SQL works best.

        // Let's do a safe raw query to group DiscoveryImpression by listingId where listing belongs to sellerTenantId
        const topListingsRaw = await prisma.$queryRaw`
            SELECT d."listingId", COUNT(d.id) as impressions
            FROM "DiscoveryImpression" d
            JOIN "NetworkListing" l ON d."listingId" = l.id
            WHERE l."sellerCompanyId" = ${auth.user.companyId}
            AND d."createdAt" >= NOW() - INTERVAL '30 days'
            GROUP BY d."listingId"
            ORDER BY impressions DESC
            LIMIT 5
        ` as any[];

        // Try getting listing details for the top
        const topListings = [];
        if (topListingsRaw && topListingsRaw.length > 0) {
            const listings = await prisma.networkListing.findMany({
                where: { id: { in: topListingsRaw.map(r => r.listingId) } },
                include: { globalProduct: { select: { name: true } } }
            });
            for (const r of topListingsRaw) {
                const listing = listings.find(l => l.id === r.listingId);
                if (listing) {
                    topListings.push({
                        listingId: r.listingId,
                        title: listing.globalProduct?.name || "Bilinmeyen Ürün",
                        impressions: Number(r.impressions)
                    });
                }
            }
        }

        return NextResponse.json({
            kpis: {
                impressionsToday: todayUsage._sum.sponsoredImpressions || 0,
                impressions7d: last7dUsage._sum.sponsoredImpressions || 0,
                impressions30d: last30dUsage._sum.sponsoredImpressions || 0,
                boostRevenue30d: null // Optional logic omitted for brevity
            },
            series: series.map(s => ({
                date: s.day,
                impressions: s.sponsoredImpressions
            })),
            topListings
        });

    } catch (e: any) {
        console.error("Boost Analytics API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
