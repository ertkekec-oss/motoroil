import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companyId = user.companyId || session?.companyId || session?.settings?.companyId;

        const body = await req.json();
        const { eventName, properties } = body;

        // Valid Events (Activation Funnel)
        const validEvents = [
            "CONTROL_HUB_VIEWED",
            "SETUP_CHECKLIST_SHOWN",
            "SETUP_ACTION_CLICKED",
            "FEATURE_TILE_CLICKED",
            "KPI_CARD_HOVERED"
        ];

        if (!validEvents.includes(eventName)) {
            return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
        }

        // PII redactor
        const { email, phone, name, ...safeProperties } = properties || {};

        // Use AuditLog as provisional "Daily Metrics / Event Logging" layer
        await prisma.auditLog.create({
            data: {
                action: eventName,
                entity: "ANALYTICS_EVENT",
                entityId: companyId || "global",
                userId: user.id || "anonymous",
                tenantId: companyId || null,
                details: JSON.stringify({
                    role: user.role || "unknown",
                    ...safeProperties
                })
            }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        // Tracker routes shouldn't crash the frontend or visibly fail
        console.error("Metrics Tracking Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
