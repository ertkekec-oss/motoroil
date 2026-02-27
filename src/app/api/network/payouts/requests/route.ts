import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const take = parseInt(searchParams.get("take") || "20", 10);

    const queryArgs: any = {
        where: { sellerTenantId: auth.user.companyId },
        take: take > 50 ? 50 : take,
        orderBy: [{ requestedAt: "desc" }, { id: "asc" }],
        include: {
            destination: { select: { ibanMasked: true, type: true } }
        }
    };

    if (cursor) {
        queryArgs.cursor = { id: cursor };
        queryArgs.skip = 1;
    }

    try {
        const requests = await prisma.payoutRequest.findMany(queryArgs);

        const nextCursor = requests.length === queryArgs.take ? requests[requests.length - 1].id : null;

        return NextResponse.json({
            items: requests.map(r => ({
                id: r.id,
                amount: r.amount,
                status: r.status,
                createdAt: r.requestedAt,
                updatedAt: r.processedAt || r.approvedAt,
                destination: r.destination?.ibanMasked,
                failureMessage: r.failureMessage
            })),
            nextCursor
        });
    } catch (e: any) {
        console.error("Payout Requests GET Error:", e);
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
        const { amount, destinationId, idempotencyKey } = body;

        if (!amount || amount <= 0 || !destinationId) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const resolvedKey = idempotencyKey || uuidv4();

        // Ensure destination belongs to this tenant
        const dest = await prisma.payoutDestination.findUnique({
            where: { id: destinationId }
        });

        if (!dest || dest.sellerTenantId !== auth.user.companyId || dest.status !== "ACTIVE") {
            return NextResponse.json({ error: "Invalid or inactive destination" }, { status: 400 });
        }

        // Ideally here we call Fin2A service, but we'll mock creating the request entity
        const newReq = await prisma.payoutRequest.create({
            data: {
                sellerTenantId: auth.user.companyId,
                destinationId,
                amount,
                status: "REQUESTED",
                idempotencyKey: resolvedKey,
                createdByUserId: auth.user.id
            }
        });

        return NextResponse.json({
            id: newReq.id,
            amount: newReq.amount,
            status: newReq.status,
            createdAt: newReq.requestedAt
        }, { status: 201 });
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: "Request already processing" }, { status: 400 });
        }
        console.error("Payout Requests POST Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
