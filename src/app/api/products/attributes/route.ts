import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const branch = (session.branch as string) || 'Merkez';
        const tenantId = session.tenantId;

        // 1) Find Company ID from Tenant ID directly (to be safe)
        let resolvedCompanyId = session.companyId;

        // If we don't have a direct companyId but have a tenantId (standard SaaS user),
        // let's resolve the primary company for this tenant.
        if (!resolvedCompanyId && tenantId) {
            const company = await prisma.company.findFirst({
                where: { tenantId },
                select: { id: true }
            });
            if (company) {
                resolvedCompanyId = company.id;
            }
        }

        // 2) Build Where Clause
        const whereClause: any = { branch };

        // Only fetch company-specific attributes if we successfully resolved a companyId
        if (resolvedCompanyId) {
            whereClause.companyId = resolvedCompanyId;
        }

        let attributes;
        try {
            // First attempt: Try to get attributes for this specific company + branch
            attributes = await prisma.variantAttribute.findMany({
                where: whereClause,
                include: { values: true }
            });
        } catch (primaError: any) {
            // Fallback: If schema doesn't support companyId or query fails
            console.warn("Retrying attributes fetch without companyId filter. Error:", primaError.message);

            // 3) CRITICAL: Remove ALL potential company-related filters
            delete whereClause.company;
            delete whereClause.companyId;

            // Retry search globally for the branch
            attributes = await prisma.variantAttribute.findMany({
                where: whereClause,
                include: { values: true }
            });
        }

        return NextResponse.json({ success: true, attributes });
    } catch (error: any) {
        console.error("Attributes Fetch Fatal Error:", error);
        return NextResponse.json({ success: false, error: error.message, details: error.toString() }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { name, values } = await request.json();
        const branch = (session.branch as string) || 'Merkez';

        if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 });

        const attribute = await prisma.variantAttribute.create({
            data: {
                name,
                branch,
                values: {
                    create: (values || []).map((v: string) => ({ value: v }))
                }
            },
            include: { values: true }
        });

        return NextResponse.json({ success: true, attribute });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
