import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        // Assume admin only
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const contracts = await prisma.platformContract.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, contracts });
    } catch (error: any) {
        console.error('Fetch contracts error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const { title, slug, content, isActive } = data;

        // If slug exists, increment version, otherwise spawn version 1
        const existing = await prisma.platformContract.findUnique({ where: { slug } });
        
        let contract;
        if (existing) {
            contract = await prisma.platformContract.update({
                where: { slug },
                data: {
                    title,
                    content,
                    version: existing.version + 1,
                    isActive: isActive ?? true
                }
            });
        } else {
            contract = await prisma.platformContract.create({
                data: {
                    title,
                    slug,
                    content,
                    version: 1,
                    isActive: isActive ?? true
                }
            });
        }

        return NextResponse.json({ success: true, contract });
    } catch (error: any) {
        console.error('Save contract error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
