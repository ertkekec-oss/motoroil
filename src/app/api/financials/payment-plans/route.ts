import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, totalAmount, installmentCount, startDate, description, branch, type } = body;

        // Validation
        if (!title || !totalAmount || !installmentCount || !startDate) {
            return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
        }

        const start = new Date(startDate);
        const total = parseFloat(totalAmount);
        const count = parseInt(installmentCount);

        // Taksit tutarı hesaplama (kuruş hassasiyeti)
        const rawAmount = total / count;
        const monthlyAmount = Math.floor(rawAmount * 100) / 100;
        const remainder = Number((total - (monthlyAmount * count)).toFixed(2));

        // Create Plan and Installments Transactionally
        const plan = await prisma.paymentPlan.create({
            data: {
                title,
                totalAmount: total,
                installmentCount: count,
                startDate: start,
                description,
                branch: branch || 'Merkez',
                type: type || 'Kredi',
                installments: {
                    create: Array.from({ length: count }).map((_, i) => {
                        const dueDate = new Date(start);
                        dueDate.setMonth(dueDate.getMonth() + i);

                        // Add remainder to last installment
                        const amount = i === count - 1 ? monthlyAmount + remainder : monthlyAmount;

                        return {
                            installmentNo: i + 1,
                            dueDate: dueDate,
                            amount: amount,
                            status: 'Pending'
                        };
                    })
                }
            },
            include: { installments: true }
        });

        return NextResponse.json({ success: true, plan });

    } catch (error: any) {
        console.error('Payment Plan Create Error:', error);
        return NextResponse.json({ error: 'Plan oluşturulamadı: ' + error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');

        const whereClause: any = {};
        if (branch && branch !== 'Tümü' && branch !== 'Merkez') { // Merkez sees all usually, or filter specifically
            // whereClause.branch = branch; // Optional filtering
        }

        const plans = await prisma.paymentPlan.findMany({
            where: whereClause,
            include: {
                installments: {
                    orderBy: { installmentNo: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, plans });
    } catch (error) {
        return NextResponse.json({ error: 'Planlar getirilemedi' }, { status: 500 });
    }
}
