import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-key-change-in-production');

export async function POST(req: Request) {
    // pairing Code girişi genelde admin paneli açık bir cihazdan yapılır
    // Ancak kurumsal kurguda tabletin kendisi pairingCode girer
    // Bu yüzden bu endpoint'in auth'ı pairingCode'un geçerliliği üzerinden yürür

    try {
        const { pairingCode } = await req.json();

        if (!pairingCode) {
            return NextResponse.json({ success: false, error: "Eşleştirme kodu gereklidir." }, { status: 400 });
        }

        // pairingCode üzerinden cihazı bul
        const display = await prisma.pdksDisplay.findUnique({
            where: { pairingCode },
        });

        if (!display || !display.isActive) {
            return NextResponse.json({ success: false, error: "Geçersiz veya pasif eşleştirme kodu." }, { status: 404 });
        }

        // Public IP'yi al (Audit ve Güvenlik için)
        const xff = req.headers.get("x-forwarded-for");
        const ip = xff ? xff.split(",")[0].trim() : "unknown";

        // Display kaydını güncelle
        await prisma.pdksDisplay.update({
            where: { id: display.id },
            data: {
                lastPublicIp: ip,
                lastHeartbeatAt: new Date(),
            },
        });

        // Display için özel bir session token üret
        const token = await new SignJWT({
            displayId: display.id,
            tenantId: display.tenantId,
            siteId: display.siteId,
            type: "PDKS_DISPLAY"
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("30d") // Tabletler uzun süre açık kalır
            .sign(JWT_SECRET);

        const cookieStore = await cookies();
        cookieStore.set("pdks_display_sess", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 30 // 30 gün
        });

        return NextResponse.json({
            success: true,
            displayId: display.id,
            siteName: display.name,
        });
    } catch (error: any) {
        console.error("[PDKS Display Pair Error]:", error);
        return NextResponse.json({ success: false, error: "Eşleştirme sırasında bir hata oluştu." }, { status: 500 });
    }
}
