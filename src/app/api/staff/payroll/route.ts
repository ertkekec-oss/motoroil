import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // e.g. "2024-02"
    const branch = searchParams.get('branch');

    const where: any = {};
    if (period) where.period = period;

    // Filter by staff branch if needed, but payroll links to staff. 
    // If branch param exists, we filter staff.
    if (branch && branch !== 'all') {
        where.staff = { branch: branch };
    }

    try {
        const payrolls = await prisma.payroll.findMany({
            where,
            include: { staff: true },
            orderBy: { staff: { name: 'asc' } }
        });
        return NextResponse.json({ success: true, payrolls });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { period, staffIds } = body; // Array of staff IDs to generate for

        if (!period) return NextResponse.json({ success: false, error: 'Dönem girilmelidir' }, { status: 400 });

        let processed = 0;

        // Use transaction? Or loop.
        // For each staff, check if payroll exists for this period. If not, create.

        const staffList = await prisma.staff.findMany({
            where: {
                deletedAt: null,
                ...(staffIds && staffIds.length ? { id: { in: staffIds } } : {})
            }
        });

        for (const staff of staffList) {
            const exists = await prisma.payroll.findUnique({
                where: {
                    staffId_period: {
                        staffId: staff.id,
                        period: period
                    }
                }
            });

            if (!exists) {
                await prisma.payroll.create({
                    data: {
                        staffId: staff.id,
                        period,
                        salary: staff.salary || 0,
                        netPay: staff.salary || 0, // Logic for tax/deductions can go here later
                        status: 'Bekliyor'
                    }
                });
                processed++;
            }
        }

        return NextResponse.json({ success: true, message: `${processed} adet bordro oluşturuldu.` });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
