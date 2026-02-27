import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const ticket = await prisma.ticket.findFirst({
            where: {
                id: params.id,
                tenantId: auth.user.companyId
            },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
                tenant: { select: { name: true } }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: ticket.id,
            status: ticket.status,
            type: ticket.type,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            messages: ticket.messages.map(m => ({
                id: m.id,
                message: m.redactedMessage || m.message,
                createdAt: m.createdAt,
                senderRole: m.senderRole,
                isMe: m.senderTenantId === auth.user?.companyId
            }))
        });
    } catch (e: any) {
        console.error("Ticket Details Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // PII
        const redactedMessage = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL_REDACTED]")
            .replace(/\+?90\s*\(?\d{3}\)?\s*\d{3}\s*\d{2}\s*\d{2}/g, "[PHONE_REDACTED]");

        // Ensure ticket belongs to company and is open
        const ticket = await prisma.ticket.findFirst({
            where: {
                id: params.id,
                tenantId: auth.user.companyId
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        if (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS") {
            return NextResponse.json({ error: "Cannot add messages to closed tickets" }, { status: 400 });
        }

        const newMessage = await prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                message,
                redactedMessage,
                senderRole: "BUYER",
                senderTenantId: auth.user.companyId
            }
        });

        return NextResponse.json({
            id: newMessage.id,
            message: newMessage.redactedMessage,
            createdAt: newMessage.createdAt,
            senderRole: newMessage.senderRole,
            isMe: true
        }, { status: 201 });
    } catch (e: any) {
        console.error("Ticket Details POST Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
