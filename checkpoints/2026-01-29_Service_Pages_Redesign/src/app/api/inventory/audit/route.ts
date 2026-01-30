
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');

        if (!branch) return NextResponse.json({ error: 'Branch required' }, { status: 400 });

        const audit = await prisma.inventoryAudit.findFirst({
            where: { branch, status: 'in_progress' },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(audit || { status: 'none' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Check for existing in_progress audit
        const existing = await prisma.inventoryAudit.findFirst({
            where: { branch: data.branch, status: 'in_progress' }
        });

        if (existing) {
            const updated = await prisma.inventoryAudit.update({
                where: { id: existing.id },
                data: {
                    items: data.items,
                    status: data.status || 'in_progress',
                    finishedAt: data.status === 'completed' ? new Date() : null
                }
            });
            return NextResponse.json(updated);
        } else {
            const audit = await prisma.inventoryAudit.create({
                data: {
                    branch: data.branch,
                    items: data.items || [],
                    reportedBy: data.reportedBy,
                    status: 'in_progress'
                }
            });
            return NextResponse.json(audit);
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
