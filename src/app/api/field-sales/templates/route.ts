
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({ where: { tenantId: session.tenantId } });
        }

        if (!company) return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });

        const templates = await (prisma as any).routeTemplate.findMany({
            where: { companyId: company.id },
            include: {
                stops: {
                    include: {
                        customer: { select: { id: true, name: true, address: true, city: true, district: true } }
                    },
                    orderBy: { sequence: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(templates);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, stops } = body;

        if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 });

        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({ where: { tenantId: session.tenantId } });
        }

        if (!company) return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });

        const template = await (prisma as any).routeTemplate.create({
            data: {
                companyId: company.id,
                name,
                stops: {
                    create: stops?.map((s: any) => ({
                        customerId: s.customerId,
                        sequence: s.sequence
                    })) || []
                }
            },
            include: { stops: true }
        });

        return NextResponse.json(template);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
