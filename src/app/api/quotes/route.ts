import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const where: any = {
            companyId: user.companyId
        };

        if (status && status !== 'All') {
            where.status = status;
        }

        // Branch Isolation: Only show quotes for this branch by default
        if (user.branch && user.branch !== 'Merkez') {
            where.branch = user.branch;
        }

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
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const body = await req.json();
        const { customerId, items, description, validUntil, subTotal, taxAmount, totalAmount } = body;

        const companyId = user.companyId;
        if (!companyId) throw new Error("Şirket kimliği bulunamadı.");

        const branch = user.branch || 'Merkez';

        // Generate Quote No (TEK-YYYYMM-001)
        const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');

        // Find last quote of this month to increment
        const lastQuote = await prisma.quote.findFirst({
            where: {
                quoteNo: { startsWith: `TEK-${datePrefix}` },
                branch: branch,
                companyId: companyId
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
                branch: branch,
                companyId: companyId
            }
        });

        return NextResponse.json({ success: true, quote });

    } catch (error: any) {
        console.error('[Quotes POST Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
