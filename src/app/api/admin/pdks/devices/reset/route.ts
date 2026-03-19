import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';
    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    const role = auth.user.role?.toLowerCase() || '';
    const hasAccess = isPlatformAdmin || 
                      role.includes('admin') || 
                      role.includes('owner') || 
                      role.includes('müdür') || 
                      role.includes('manager') ||
                      auth.user.permissions?.includes('staff_manage');

    if (!hasAccess) {
        return NextResponse.json({ success: false, error: "Cihaz kilidini sıfırlama yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const { staffId } = await req.json();
        if (!staffId) return NextResponse.json({ success: false, error: "Personel kimliği gerekli." }, { status: 400 });

        const staff = await prisma.staff.findFirst({
            where: { id: staffId, tenantId: effectiveTenantId }
        });

        if (!staff) {
            return NextResponse.json({ success: false, error: "Personel bulunamadı." }, { status: 404 });
        }

        // Try mapping the Staff to a User using username/email
        const user = await prisma.user.findFirst({
            where: {
                tenantId: effectiveTenantId,
                OR: [
                    staff.email ? { email: staff.email } : null,
                    staff.username ? { username: staff.username } : null
                ].filter(Boolean) as any[]
            }
        });

        // The pdks check-in logic typically stores the device lock on `userId` (which represents the connected User).
        // It could also fallback to `targetStaffId` internally. We should try to clear by both possible IDs to ensure perfect reset.
        const possibleUserIds = [staff.id];
        if (user) possibleUserIds.push(user.id);

        const deleteResult = await prisma.pdksEmployeeDevice.deleteMany({
            where: {
                tenantId: effectiveTenantId,
                userId: { in: possibleUserIds }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Cihaz kilidi başarıyla sıfırlandı.", 
            deletedCount: deleteResult.count 
        });
    } catch (error: any) {
        console.error("[PDKS Device Reset Error]:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
