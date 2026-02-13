import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: { auditId: string } }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { auditId } = await (params as any);

    try {
        const audit = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { id: auditId },
        });

        if (!audit) {
            return NextResponse.json({ error: "İşlem kaydı bulunamadı" }, { status: 404 });
        }

        // Tenant Isolation Check
        const role = auth.user.role?.toUpperCase() || "";
        const isAdmin = role === "PLATFORM_ADMIN" || role === "SUPER_ADMIN";

        if (!isAdmin) {
            const company = await prisma.company.findFirst({
                where: { tenantId: auth.user.tenantId },
                select: { id: true },
            });

            if (audit.companyId !== company?.id) {
                return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
            }
        }

        return NextResponse.json({
            status: audit.status,
            actionKey: audit.actionKey,
            result: audit.status === "SUCCESS" ? audit.responsePayload : null,
            errorMessage: audit.errorMessage,
            updatedAt: audit.updatedAt
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
