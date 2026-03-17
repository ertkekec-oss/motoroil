import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    // Yetki kontrolü
    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';
    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    const allowedRoles = ['admin', 'müdür', 'company_manager', 'tenant_admin'];
    const userRole = auth.user.role?.toLowerCase();

    if (!isPlatformAdmin &&
        !allowedRoles.includes(userRole) &&
        !auth.user.permissions?.includes('staff_manage')) {
        return NextResponse.json({ success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const displays = await prisma.pdksDisplay.findMany({
            where: (!isPlatformAdmin || auth.user.impersonateTenantId) ? { tenantId: effectiveTenantId } : {},
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, displays });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';
    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    const allowedRoles = ['admin', 'müdür', 'company_manager', 'tenant_admin'];
    const userRole = auth.user.role?.toLowerCase();

    // Yetki kontrolü
    if (!isPlatformAdmin &&
        !allowedRoles.includes(userRole) &&
        !auth.user.permissions?.includes('staff_manage')) {
        return NextResponse.json({ success: false, error: "Tablet ekleme yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const { name, siteId } = await req.json();

        if (!name) return NextResponse.json({ success: false, error: "Tablet adı gereklidir." }, { status: 400 });

        // Benzersiz pairing code üret (PDKS-XXXXX)
        const pairingCode = `PDKS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const display = await prisma.pdksDisplay.create({
            data: {
                tenantId: effectiveTenantId,
                siteId: siteId || auth.user.branch || "MERKEZ",
                name,
                pairingCode,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, display });
    } catch (error: any) {
        console.error("[PDKS Display Create Error]:", error);
        return NextResponse.json({ success: false, error: "Tablet oluşturulamadı: " + error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';

    const allowedRoles = ['admin', 'müdür', 'company_manager', 'tenant_admin'];
    const userRole = auth.user.role?.toLowerCase();

    if (!isPlatformAdmin &&
        !allowedRoles.includes(userRole) &&
        !auth.user.permissions?.includes('staff_manage')) {
        return NextResponse.json({ success: false, error: "Tablet düzenleme yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const { id, announcement, isActive, name } = await req.json();

        if (!id) return NextResponse.json({ success: false, error: "ID gerekli" }, { status: 400 });

        const existing = await prisma.pdksDisplay.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ success: false, error: "Bulunamadı" }, { status: 404 });
        if (!isPlatformAdmin && existing.tenantId !== effectiveTenantId && !auth.user.impersonateTenantId) {
            return NextResponse.json({ success: false, error: "Erişim reddedildi" }, { status: 403 });
        }

        const display = await prisma.pdksDisplay.update({
            where: {
                id
            },
            data: {
                announcement,
                isActive,
                name
            }
        });

        return NextResponse.json({ success: true, display });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const effectiveTenantId = auth.user.impersonateTenantId || auth.user.tenantId;

    const isPlatformAdmin = auth.user.tenantId === 'PLATFORM_ADMIN' || auth.user.role === 'SUPER_ADMIN';

    const allowedRoles = ['admin', 'müdür', 'company_manager', 'tenant_admin'];
    const userRole = auth.user.role?.toLowerCase();

    if (!isPlatformAdmin &&
        !allowedRoles.includes(userRole) &&
        !auth.user.permissions?.includes('staff_manage')) {
        return NextResponse.json({ success: false, error: "Tablet silme yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ success: false, error: "ID gerekli" }, { status: 400 });

        const existing = await prisma.pdksDisplay.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ success: false, error: "Bulunamadı" }, { status: 404 });
        if (!isPlatformAdmin && existing.tenantId !== effectiveTenantId && !auth.user.impersonateTenantId) {
            return NextResponse.json({ success: false, error: "Erişim reddedildi" }, { status: 403 });
        }

        await prisma.pdksDisplay.delete({
            where: {
                id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
