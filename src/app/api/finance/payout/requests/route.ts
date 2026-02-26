import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPayoutRequest } from "@/services/finance/payout/requests";
import { PrismaClient, PayoutRequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { destinationId, amount, currency, idempotencyKey } = body;

        const request = await createPayoutRequest({
            sellerTenantId: session.tenantId,
            destinationId,
            amount: Number(amount),
            currency: currency || 'TRY',
            idempotencyKey,
            userId: session.userId
        });

        return NextResponse.json(request);
    } catch (e: any) {
        const status = e.statusCode || 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const statusStr = url.searchParams.get('status');
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50;
        const cursor = url.searchParams.get('cursor');

        const whereBlock: any = { sellerTenantId: session.tenantId };

        if (statusStr) {
            whereBlock.status = statusStr as PayoutRequestStatus;
        }

        const args: any = {
            where: whereBlock,
            orderBy: { requestedAt: 'desc' },
            take: limit
        };

        if (cursor) {
            args.cursor = { id: cursor };
            args.skip = 1; // skip the cursor record itself
        }

        const items = await prisma.payoutRequest.findMany(args);

        const nextCursor = items.length === limit ? items[items.length - 1].id : null;

        return NextResponse.json({ items, nextCursor });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
