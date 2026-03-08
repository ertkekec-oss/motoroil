import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const signals = await prisma.demandSignal.findMany({
            orderBy: { signalStrength: 'desc' },
            take: 100
        });
        return NextResponse.json(signals);
    } catch (error) {
        console.error("Failed to fetch admin demand signals:", error);
        return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
    }
}
