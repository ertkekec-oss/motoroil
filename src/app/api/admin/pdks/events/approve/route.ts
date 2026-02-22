import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';
    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    if (!isPlatformAdmin &&
        auth.user.role?.toLowerCase() !== 'admin' &&
        auth.user.role?.toLowerCase() !== 'müdür' &&
        !auth.user.permissions?.includes('staff_manage')) {
        return NextResponse.json({ success: false, error: "PDKS onaylama yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const { eventId, status, notes } = await req.json();

        if (!eventId || !status) {
            return NextResponse.json({ success: false, error: "EventID ve durum gereklidir" }, { status: 400 });
        }

        const event = await prisma.pdksEvent.update({
            where: { id: eventId, tenantId: effectiveTenantId },
            data: {
                status: status as any,
                notes: notes || undefined
            }
        });

        // Eğer onaylandıysa ve SHIFT_START ise normal Attendance tablosuna da işleyebiliriz
        // Simdilik sadece statü güncelliyoruz.

        return NextResponse.json({ success: true, event });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
