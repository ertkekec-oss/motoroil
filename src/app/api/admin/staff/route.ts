import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getRequestContext } from "@/lib/api-context";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        if (role !== "SUPER_ADMIN" && role !== "OWNER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const staff = await prisma.user.findMany({
            where: {
                OR: [
                    { role: { startsWith: "PLATFORM_" } },
                    { role: "SUPER_ADMIN" },
                    { role: "OWNER" }
                ],
                tenantId: "PLATFORM_ADMIN"
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });

        // Add any other user who acts as a platform role across tenants just in case
        const otherStaff = await prisma.user.findMany({
            where: {
                OR: [
                    { role: { startsWith: "PLATFORM_" } },
                    { role: "SUPER_ADMIN" }
                ],
                tenantId: { not: "PLATFORM_ADMIN" }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true
            }
        });

        return NextResponse.json({ success: true, staff: [...staff, ...otherStaff] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        if (role !== "SUPER_ADMIN" && role !== "OWNER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { email, password, name, role: newRole } = body;

        if (!email || !password || !newRole) {
            return NextResponse.json({ success: false, error: "Eksik bilgi" }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({ where: { email } });
        if (existing) {
            return NextResponse.json({ success: false, error: "Bu e-posta zaten kullanılıyor." }, { status: 400 });
        }

        // Platform yetkilileri izole bir tenant ID'ye (PLATFORM_ADMIN) atanır
        const platformTenant = await prisma.tenant.upsert({
            where: { id: "PLATFORM_ADMIN" },
            update: {},
            create: { id: "PLATFORM_ADMIN", name: "Periodya Core Platform", ownerEmail: "admin@periodya.com" }
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: newRole,
                tenantId: platformTenant.id // Sadece platform'a has özel tenant
            }
        });

        return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email } });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        if (role !== "SUPER_ADMIN" && role !== "OWNER") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId: targetUserId } = body;

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            return NextResponse.json({ success: false, error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        if (targetUser.role === "SUPER_ADMIN" && targetUser.id === userId) {
            return NextResponse.json({ success: false, error: "Kendinizi silemezsiniz" }, { status: 400 });
        }

        // Sadece yetki düşürmesi de yapabilirdik ama platform personeli olduğu için direkt siliyoruz.
        await prisma.user.delete({ where: { id: targetUserId } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
