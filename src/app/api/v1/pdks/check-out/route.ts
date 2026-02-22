import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { getPublicClientIp } from "@/lib/pdks/ip";

export async function POST(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            mode,
            deviceFp,
            clientTime,
            location,
            offlineId
        } = body;

        const user = auth.user;
        const tenantId = user.tenantId;
        const userId = user.id;

        const requestIp = getPublicClientIp(req);

        // Çıkış işlemleri genellikle daha esnektir
        // Sadece deviceFp doğrulaması ve olay kaydı yeterli olabilir

        if (offlineId) {
            const existing = await prisma.pdksIdempotency.findUnique({
                where: { offlineId }
            });
            if (existing) {
                return NextResponse.json({ success: true, eventId: existing.eventId, status: "ALREADY_PROCESSED" });
            }
        }

        const event = await prisma.pdksEvent.create({
            data: {
                tenantId,
                userId,
                type: "SHIFT_END",
                mode: mode as any,
                status: "APPROVED",
                deviceFp,
                requestPublicIp: requestIp,
                lat: location?.lat,
                lng: location?.lng,
                accuracy: location?.acc,
                clientTime: new Date(clientTime),
                offlineId
            }
        });

        if (offlineId) {
            await prisma.pdksIdempotency.create({
                data: { tenantId, userId, offlineId, eventId: event.id }
            });
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            status: "APPROVED"
        });

    } catch (error: any) {
        console.error("[PDKS Check-out Error]:", error);
        return NextResponse.json({ success: false, error: "Çıkış işlemi sırasında bir hata oluştu." }, { status: 500 });
    }
}
