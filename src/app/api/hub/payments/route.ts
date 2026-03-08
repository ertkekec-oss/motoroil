import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = user.companyId || user.tenantId;
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Company ID not found' }, { status: 400 });
        }

        const bankStatements = await prisma.bankStatement.findMany({
            where: {
                companyId: companyId as string,
            },
            orderBy: { statementDate: 'desc' },
            take: 10,
        });

        return NextResponse.json({ success: true, bankStatements });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
