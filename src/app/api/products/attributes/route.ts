import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const attributes = await prisma.variantAttribute.findMany({
            where: { branch: (session.branch as string) || 'Merkez' },
            include: { values: true }
        });

        return NextResponse.json({ success: true, attributes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
