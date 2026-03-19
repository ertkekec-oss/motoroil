import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const url = new URL(req.url)
    const supplierTenantId = url.searchParams.get("supplierTenantId")

    if (!supplierTenantId) {
        return NextResponse.json({ ok: false, error: "MISSING_TENANT" }, { status: 400 })
    }

    try {
        const config = await prisma.tenantPortalConfig.findUnique({
            where: { tenantId: supplierTenantId },
            select: { dealerAuthMode: true }
        })

        return NextResponse.json({
            ok: true,
            dealerAuthMode: config?.dealerAuthMode || "PASSWORD_ONLY"
        })
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, { status: 500 })
    }
}
