import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const displays = await prisma.pdksDisplay.findMany({
            where: { tenantId: auth.user.tenantId },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, displays });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { name, siteId } = await req.json();

        // Benzersiz pairing code üret (PDKS-XXXXX)
        const pairingCode = `PDKS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const display = await prisma.pdksDisplay.create({
            data: {
                tenantId: auth.user.tenantId,
                siteId: siteId || "DEFAULT",
                name,
                pairingCode,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, display });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ success: false, error: "ID gerekli" }, { status: 400 });

        await prisma.pdksDisplay.delete({
            where: { id, tenantId: auth.user.tenantId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
