
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { prismaBase } from '@/lib/prismaBase';

export const dynamic = 'force-dynamic';

export async function GET() {
    const status = {
        prismaExtended: typeof prisma,
        prismaBase: typeof prismaBase,
        models: {
            company: !!(prisma as any)?.company,
            product: !!(prisma as any)?.product,
            user: !!(prisma as any)?.user
        },
        baseModels: {
            company: !!(prismaBase as any)?.company,
            user: !!(prismaBase as any)?.user
        },
        env: process.env.VERCEL_ENV
    };

    try {
        const companyCount = await (prisma as any).company.count();
        (status as any).dbCheck = { success: true, count: companyCount };
    } catch (e: any) {
        (status as any).dbCheck = { success: false, error: e.message };
    }

    return NextResponse.json(status);
}
