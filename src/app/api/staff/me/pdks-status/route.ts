import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const user = auth.user;
        const userId = user.id;

        const staffRecord = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    user.username ? { username: user.username } : null,
                    user.email ? { username: user.email } : null,
                    user.email ? { email: user.email } : null
                ].filter(Boolean),
                deletedAt: null
            },
            select: {
                id: true,
                shiftTemplate: true,
                dailyWorkingHours: true,
                weeklyOffDays: true,
            }
        });

        const targetStaffId = staffRecord ? staffRecord.id : userId;

        const activeAtt = await (prisma as any).attendance.findFirst({
            where: {
                staffId: targetStaffId,
                checkOut: null,
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
            staff: staffRecord,
            activeSession: activeAtt,
            isWorking: !!activeAtt
        });

    } catch (error: any) {
        console.error("[PDKS Status Fetch Error]:", error);
        return NextResponse.json({ success: false, error: error.message || "Durum alınırken hata", stack: error.stack }, { status: 500 });
    }
}
