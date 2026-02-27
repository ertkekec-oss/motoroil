import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const take = parseInt(searchParams.get("take") || "20", 10);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    try {
        const whereClause: any = { tenantId: auth.user.companyId };

        if (status && status !== "ALL") {
            whereClause.status = status;
        }

        if (type && type !== "ALL") {
            whereClause.type = type;
        }

        const queryArgs: any = {
            where: whereClause,
            take: take > 50 ? 50 : take,
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        };

        if (cursor) {
            queryArgs.cursor = { id: cursor };
            queryArgs.skip = 1;
        }

        const tickets = await prisma.ticket.findMany(queryArgs);

        const nextCursor = tickets.length === queryArgs.take ? tickets[tickets.length - 1].id : null;

        return NextResponse.json({
            items: tickets.map(t => ({
                id: t.id,
                type: t.type,
                status: t.status,
                priority: t.priority,
                createdAt: t.createdAt,
                relatedEntityType: t.relatedEntityType,
                relatedEntityId: t.relatedEntityId,
                lastMessageTime: t.messages[0]?.createdAt || t.createdAt,
                unreadCount: 0 // Mocked for now
            })),
            nextCursor
        });

    } catch (e: any) {
        console.error("Tickets GET Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, message, relatedEntityType, relatedEntityId } = body;

        if (!type || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // PII Redaction Simulation (G1 rules)
        const redactedMessage = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL_REDACTED]")
            .replace(/\+?90\s*\(?\d{3}\)?\s*\d{3}\s*\d{2}\s*\d{2}/g, "[PHONE_REDACTED]");

        const ticket = await prisma.ticket.create({
            data: {
                tenantId: auth.user.companyId,
                type,
                status: "OPEN",
                priority: "MEDIUM",
                createdByUserId: auth.user.id,
                relatedEntityType: relatedEntityType || null,
                relatedEntityId: relatedEntityId || null,
                messages: {
                    create: {
                        message,
                        redactedMessage,
                        senderRole: "BUYER", // or SELLER based on context, here we assume tenant is creating
                        senderTenantId: auth.user.companyId
                    }
                }
            },
            include: {
                messages: true
            }
        });

        return NextResponse.json({
            id: ticket.id,
            status: ticket.status,
            createdAt: ticket.createdAt,
            messages: ticket.messages
        }, { status: 201 });
    } catch (e: any) {
        console.error("Ticket POST Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
