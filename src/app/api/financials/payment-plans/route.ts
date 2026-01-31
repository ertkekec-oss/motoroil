import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, totalAmount, installmentCount, startDate, description, branch, type, direction, customerId, supplierId, isExisting } = body;

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
        const plan = await prisma.$transaction(async (tx) => {
            const plan = await tx.paymentPlan.create({
                data: {
                    title,
                    totalAmount: total,
                    installmentCount: count,
                    startDate: start,
                    description,
                    branch: branch || 'Merkez',
                    type: type || 'Kredi',
                    direction: direction || 'OUT',
                    customerId,
                    supplierId,
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

            // HANDLE FINANCIAL EFFECTS (Cari Hesaplara İşle)

            // Eğer "Mevcut Bakiyeden Dönüştürme" (isExisting=true) seçildiyse:
            // Yeni bir borç yaratmıyoruz. Müşteri/Tedarikçi zaten bakiyesinde bu tutarı taşıyor.
            // Sadece bu bakiyeyi bir plana bağlamış olduk.

            if (!isExisting) {
                // 1. Receivables (Vadeli Satış) -> Müşteri Borçlanır
                if (direction === 'IN' && customerId) {
                    // Create Sales Transaction (Without Kasa - Veresiye)
                    await tx.transaction.create({
                        data: {
                            type: 'Sales',
                            amount: total,
                            description: `Vadeli Satış Planı: ${title}`,
                            date: start,
                            branch: branch || 'Merkez',
                            customerId: customerId
                            // kasaId is null/undefined (Veresiye)
                        }
                    });

                    // Update Customer Balance (Increment = Borç Artışı to us)
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { increment: total } }
                    });
                }

                // 2. Payables (Vadeli Borç/Mal Alımı) -> Tedarikçiye Borçlanırız
                if (direction === 'OUT' && supplierId) {
                    // Create Purchase Transaction
                    await tx.transaction.create({
                        data: {
                            type: 'Purchase',
                            amount: total,
                            description: `Vadeli Borç Planı: ${title}`,
                            date: start,
                            branch: branch || 'Merkez',
                            supplierId: supplierId
                            // kasaId is null
                        }
                    });

                    // Update Supplier Balance (Decrement = Borçlanma / Alacağımız Azalır)
                    // Note: Supplier balance convention: (+): Alacağımız var, (-): Borcumuz var.
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: { balance: { decrement: total } }
                    });
                }
            }

            return plan;
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
        if (branch && branch !== 'Tümü' && branch !== 'Merkez') {
            /* whereClause.branch = branch; */
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
