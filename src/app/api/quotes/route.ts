import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const session = await getSession() as any;
        if (!session) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });

        const where: any = {};
        if (status && status !== 'All') {
            where.status = status;
        }

        // Branch Isolation: Only show quotes for this branch by default
        where.branch = session.branch || 'Merkez';

        const quotes = await prisma.quote.findMany({
            where,
            include: {
                customer: {
                    select: { name: true, phone: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, quotes });
    } catch (error: any) {
        console.error('[Quotes GET Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession() as any;
        if (!session) return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 });

        const body = await req.json();
        const { customerId, items, description, validUntil, subTotal, taxAmount, totalAmount } = body;

        const branch = session.branch || 'Merkez';

        // Generate Quote No (TEK-YYYYMM-001)
        const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');

        // Find last quote of this month to increment
        const lastQuote = await prisma.quote.findFirst({
            where: {
                quoteNo: { startsWith: `TEK-${datePrefix}` },
                branch: branch
            },
            orderBy: { quoteNo: 'desc' }
        });

        let seq = 1;
        if (lastQuote) {
            const parts = lastQuote.quoteNo.split('-');
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2]);
                if (!isNaN(lastSeq)) seq = lastSeq + 1;
            }
        }

        const quoteNo = `TEK-${datePrefix}-${seq.toString().padStart(3, '0')}`;

        const quote = await prisma.quote.create({
            data: {
                quoteNo,
                customerId,
                items: items || [],
                description: description || '',
                validUntil: validUntil ? new Date(validUntil) : null,
                subTotal: Number(subTotal) || 0,
                taxAmount: Number(taxAmount) || 0,
                totalAmount: Number(totalAmount) || 0,
                status: 'Draft',
                branch: branch
            }
        });

        return NextResponse.json({ success: true, quote });

    } catch (error: any) {
        console.error('[Quotes POST Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
