import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { generatePdksToken, newNonce } from "@/lib/pdks/qr";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-key-change-in-production');
const PDKS_QR_SECRET = process.env.PDKS_QR_SECRET || "default_pdks_secret_change_it";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("pdks_display_sess")?.value;

        if (!sessionToken) {
            return NextResponse.json({ success: false, error: "Oturum bulunamadı." }, { status: 401 });
        }

        // Display session doğrulanır
        const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

        if (payload.type !== "PDKS_DISPLAY") {
            return NextResponse.json({ success: false, error: "Geçersiz oturum tipi." }, { status: 403 });
        }

        const displayId = payload.displayId as string;
        const tenantId = payload.tenantId as string;
        const siteId = payload.siteId as string;

        // Display aktiflik kontrolü ve IP güncelleme
        const xff = req.headers.get("x-forwarded-for");
        const ip = xff ? xff.split(",")[0].trim() : "unknown";

        const display = await prisma.pdksDisplay.update({
            where: { id: displayId },
            data: {
                lastPublicIp: ip,
                lastHeartbeatAt: new Date(),
            }
        });

        if (!display.isActive) {
            return NextResponse.json({ success: false, error: "Cihaz pasif duruma getirilmiş." }, { status: 403 });
        }

        // Dinamik QR Token üretilir (8 sn TTL)
        const qrTtl = 8;
        const exp = Math.floor(Date.now() / 1000) + qrTtl;

        const qrToken = generatePdksToken({
            v: 1,
            tId: tenantId,
            sId: siteId,
            dId: displayId,
            nonce: newNonce(),
            exp: exp
        }, PDKS_QR_SECRET);

        return NextResponse.json({
            success: true,
            qrToken,
            exp
        });
    } catch (error: any) {
        console.error("[PDKS Display Token Error]:", error);
        return NextResponse.json({ success: false, error: "Token üretilemedi." }, { status: 500 });
    }
}
