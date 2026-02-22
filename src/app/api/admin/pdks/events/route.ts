import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const mode = searchParams.get("mode");

        const where: any = {
            tenantId: auth.user.tenantId
        };

        if (status) where.status = status;
        if (mode) where.mode = mode;

        const events = await prisma.pdksEvent.findMany({
            where,
            orderBy: { serverTime: "desc" },
            take: 100,
            include: {
                // Staff bilgisi için user join (Staff tablosu userId ile eşleşmeli)
                // User tablosu üzerinden çekebiliriz
            }
        });

        // Manuel join (Staff tablosu id: userId olarak geliyorsa)
        const userIds = Array.from(new Set(events.map(e => e.userId)));
        const staffs = await prisma.staff.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, branch: true }
        });

        const staffMap = Object.fromEntries(staffs.map(s => [s.id, s]));

        const formattedEvents = events.map(e => ({
            ...e,
            staff: staffMap[e.userId] || { name: "Bilinmeyen Personel" }
        }));

        return NextResponse.json({ success: true, events: formattedEvents });
    } catch (error: any) {
        console.error("[PDKS Events Admin GET Error]:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
