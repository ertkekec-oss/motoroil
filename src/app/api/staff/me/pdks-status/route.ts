import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const userId = auth.user.id;

        // Fetch staff details (shift info)
        const staff = await (prisma as any).staff.findUnique({
            where: { id: userId },
            select: {
                shiftTemplate: true,
                dailyWorkingHours: true,
                weeklyOffDays: true,
            }
        });

        // Fetch the active attendance (checkIn without checkOut)
        const activeAtt = await (prisma as any).attendance.findFirst({
            where: {
                staffId: userId,
                checkOut: null
            },
            orderBy: { checkIn: 'desc' },
            select: {
                id: true,
                checkIn: true,
                locationIn: true
            }
        });

        return NextResponse.json({
            success: true,
            staff,
            activeSession: activeAtt,
            isWorking: !!activeAtt
        });

    } catch (error: any) {
        console.error("[PDKS Status Fetch Error]:", error);
        return NextResponse.json({ success: false, error: "Durum alınırken hata oluştu." }, { status: 500 });
    }
}
