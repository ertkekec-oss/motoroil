import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const destinations = await prisma.payoutDestination.findMany({
            where: { sellerTenantId: auth.user.companyId },
            select: {
                id: true,
                status: true,
                ibanMasked: true,
                holderNameMasked: true,
                isDefault: true,
                createdAt: true,
                type: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(destinations);
    } catch (e: any) {
        console.error("Payout Destinations GET Error:", e);
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
        const { iban, holderName } = body;

        if (!iban || !holderName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Clean & Extract IBAN
        const cleanIban = iban.replace(/\s+/g, "").toUpperCase();
        if (cleanIban.length < 10) {
            return NextResponse.json({ error: "Invalid IBAN" }, { status: 400 });
        }

        const ibanMasked = cleanIban.slice(0, 4) + "****" + cleanIban.slice(-4);

        // Mask holder name
        const names = holderName.split(" ");
        const maskedNames = names.map((n: string) => n.charAt(0) + "*".repeat(Math.max(1, n.length - 1)));
        const holderNameMasked = maskedNames.join(" ");

        const encryptedIban = encrypt(cleanIban);

        const checkExisting = await prisma.payoutDestination.findFirst({
            where: { sellerTenantId: auth.user.companyId, ibanMasked }
        });

        if (checkExisting) {
            return NextResponse.json({ error: "IBAN already registered" }, { status: 400 });
        }

        // Check if first destination -> make default
        const count = await prisma.payoutDestination.count({
            where: { sellerTenantId: auth.user.companyId }
        });

        const newDest = await prisma.payoutDestination.create({
            data: {
                sellerTenantId: auth.user.companyId,
                type: "IBAN",
                ibanMasked,
                ibanEncrypted: encryptedIban,
                holderNameMasked,
                status: "ACTIVE",
                isDefault: count === 0
            }
        });

        return NextResponse.json({
            id: newDest.id,
            status: newDest.status,
            ibanMasked: newDest.ibanMasked,
            holderNameMasked: newDest.holderNameMasked,
            createdAt: newDest.createdAt,
            type: newDest.type
        }, { status: 201 });
    } catch (e: any) {
        console.error("Payout Destinations POST Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
