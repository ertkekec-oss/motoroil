import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { validatePdksToken } from "@/lib/pdks/qr";
import { getPublicClientIp } from "@/lib/pdks/ip";
import { rk } from "@/lib/pdks/redisKeys";

// Not: Redis entegrasyonu varsa buraya bağlanmalı, şimdilik placeholder.
const redis = {
    get: async (key: string) => null,
    set: async (key: string, val: any, options: any) => null,
    setnx: async (key: string, val: any) => true,
};

const PDKS_QR_SECRET = process.env.PDKS_QR_SECRET || "default_pdks_secret_change_it";

export async function POST(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            mode,
            qrToken,
            deviceFp,
            clientTime,
            location,
            offlineId
        } = body;

        const user = auth.user;
        const tenantId = user.tenantId;
        const userId = user.id;

        // 1. Policy Fetch (Placeholder - DB'den de alınabilir)
        const policy = {
            allowSingleDevice: true,
            minGpsAccuracyMeters: 100,
            officeIpMatch: true,
        };

        // 2. Device Binding Check
        if (policy.allowSingleDevice) {
            const binding = await prisma.pdksEmployeeDevice.findFirst({
                where: { tenantId, userId, isActive: true }
            });

            if (!binding) {
                // İlk cihaz eşleştirme
                await prisma.pdksEmployeeDevice.create({
                    data: { tenantId, userId, deviceFp }
                });
            } else if (binding.deviceFp !== deviceFp) {
                return NextResponse.json({
                    success: false,
                    error: "Bu hesap başka bir cihaza tanımlıdır. Cihaz değişikliği için yöneticiye başvurun."
                }, { status: 403 });
            }
        }

        // 3. Mod Özgü Kontroller
        let siteId = null;
        let riskFlags: string[] = [];
        const requestIp = getPublicClientIp(req);
        let displayIp = null;

        if (mode === "OFFICE_QR") {
            if (!qrToken) return NextResponse.json({ success: false, error: "QR Token gereklidir." }, { status: 400 });

            // QR Validate
            const result = validatePdksToken(qrToken, tenantId, PDKS_QR_SECRET);
            if (result.valid === false) {
                return NextResponse.json({ success: false, error: `Geçersiz QR: ${(result as any).reason}` }, { status: 400 });
            }

            const { payload } = result;
            siteId = payload.sId;

            // Replay Check (Redis)
            const replayKey = rk.replay(tenantId, payload.nonce);
            const isNew = await redis.setnx(replayKey, "1");
            // if (!isNew) return NextResponse.json({ success: false, error: "Bu kod daha önce kullanılmış." }, { status: 400 });

            // IP Match Check
            const display = await prisma.pdksDisplay.findUnique({
                where: { id: payload.dId }
            });

            displayIp = display?.lastPublicIp;
            if (policy.officeIpMatch && displayIp && requestIp !== displayIp) {
                riskFlags.push("IP_MISMATCH");
            }

        } else if (mode === "FIELD_GPS") {
            if (!location || !location.lat || !location.lng) {
                return NextResponse.json({ success: false, error: "Konum bilgisi gereklidir." }, { status: 400 });
            }

            if (location.acc > policy.minGpsAccuracyMeters) {
                riskFlags.push("LOW_ACCURACY");
            }
        }

        // 4. Idempotency Check (Offline Sync için)
        if (offlineId) {
            const existing = await prisma.pdksIdempotency.findUnique({
                where: { offlineId }
            });
            if (existing) {
                return NextResponse.json({ success: true, eventId: existing.eventId, status: "ALREADY_PROCESSED" });
            }
        }

        // 5. Event Kaydı
        const status = riskFlags.length > 0 ? "PENDING" : "APPROVED";

        const event = await prisma.pdksEvent.create({
            data: {
                tenantId,
                userId,
                siteId,
                type: "SHIFT_START",
                mode: mode as any,
                status: status as any,
                deviceFp,
                requestPublicIp: requestIp,
                displayPublicIp: displayIp,
                lat: location?.lat,
                lng: location?.lng,
                accuracy: location?.acc,
                clientTime: new Date(clientTime),
                riskScore: riskFlags.length * 50,
                riskFlags,
                offlineId
            }
        });

        if (offlineId) {
            await prisma.pdksIdempotency.create({
                data: { tenantId, userId, offlineId, eventId: event.id }
            });
        }

        // --- ENTEGRASYON: ANA PDKS (ATTENDANCE) TABLOSUNA İŞLEME ---
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find the actual Staff record associated with the logged-in User
            const staffRecord = await prisma.staff.findFirst({
                where: {
                    OR: [
                        user.username ? { username: user.username } : null,
                        user.email ? { username: user.email } : null,
                        user.email ? { email: user.email } : null
                    ].filter(Boolean) as any,
                    deletedAt: null
                }
            });

            // If a Staff record is found, use its ID. Otherwise, fallback to the User ID (for admins without Staff record logging in for test).
            const targetStaffId = staffRecord ? staffRecord.id : userId;

            // Mevcut bir günlük giriş olup olmadığını kontrol et
            const existingAttendance = await (prisma as any).attendance.findFirst({
                where: {
                    staffId: targetStaffId,
                    date: { gte: today }
                }
            });

            if (!existingAttendance) {
                await (prisma as any).attendance.create({
                    data: {
                        staffId: targetStaffId,
                        date: new Date(),
                        checkIn: new Date(clientTime),
                        locationIn: mode === "FIELD_GPS" 
                            ? (location ? `${location.lat}, ${location.lng}` : "Saha Girişi")
                            : "Ofis QR Girişi",
                        deviceInfo: deviceFp,
                        status: status === "PENDING" ? "LATE" : "ON_TIME",
                        notes: mode === "FIELD_GPS" ? "Saha Girişi (GPS) Üzerinden Otomatik" : "Ofis QR Üzerinden Otomatik"
                    }
                });
            } else if (!existingAttendance.checkOut && status === "APPROVED") {
                // Çıkış (Check-out) işlemi: Tek giriş/çıkış butonu varsa ve personel tekrar tetiklerse
                const currentTime = new Date(clientTime).getTime();
                const checkInTime = new Date(existingAttendance.checkIn).getTime();
                const diffMins = (currentTime - checkInTime) / (1000 * 60);

                // Eğer girişin üzerinden 5 dakikadan az geçmişse ignore et (yanlışlıkla basma)
                if (diffMins > 5) {
                    const workingHours = parseFloat((diffMins / 60).toFixed(2));
                    await (prisma as any).attendance.update({
                        where: { id: existingAttendance.id },
                        data: {
                            checkOut: new Date(clientTime),
                            locationOut: mode === "FIELD_GPS" 
                                ? (location ? `${location.lat}, ${location.lng}` : "Saha Çıkışı")
                                : "Ofis QR Çıkışı",
                            workingHours: workingHours,
                            notes: existingAttendance.notes ? existingAttendance.notes + ' | Çıkış yapıldı' : 'Çıkış yapıldı'
                        }
                    });
                }
            }
        } catch (attErr) {
            console.error("[PDKS Check-in Attendance Integration Error]:", attErr);
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            status,
            flags: riskFlags
        });

    } catch (error: any) {
        console.error("[PDKS Check-in Error]:", error);
        return NextResponse.json({ success: false, error: "Giriş işlemi sırasında bir hata oluştu." }, { status: 500 });
    }
}
