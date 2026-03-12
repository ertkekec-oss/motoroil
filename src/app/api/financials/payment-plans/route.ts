import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

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
        const plan = await prisma.$transaction(async (tx: any) => {
            const newPlan = await tx.paymentPlan.create({
                data: {
                    companyId: company.id, // Set Company ID
                    title,
                    totalAmount: total,
                    installmentCount: count,
                    startDate: start,
                    description,
                    branch: branch || 'Merkez',
                    type: type || 'Kredi',
                    direction: direction || 'OUT',
                    customerId: customerId || null,
                    supplierId: supplierId || null,
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
                    // Create Sales Transaction (Without Kasa - Veresiye) to record the debt
                    await tx.transaction.create({
                        data: {
                            companyId: company.id, // Set Company ID
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
            }

            // Müşteri için Çek/Senet (İşlem isExisting olsun ya da olmasın, çeki alıyorsak borcu düşer)
            if (direction === 'IN' && customerId) {
                if (type === 'Çek' || type === 'Senet') {
                    // For each installment, create a Check/Senet record
                    for (let i = 0; i < count; i++) {
                        const dueDate = new Date(start);
                        dueDate.setMonth(dueDate.getMonth() + i);
                        const amount = i === count - 1 ? monthlyAmount + remainder : monthlyAmount;
                        
                        await tx.check.create({
                            data: {
                                companyId: company.id,
                                type: type === 'Senet' ? 'Senet (Alınan)' : 'Çek (Alınan)',
                                number: `PLN-${Date.now().toString().slice(-6)}-${i+1}`,
                                dueDate: dueDate,
                                amount: amount,
                                status: 'Beklemede',
                                description: `${title} - ${i+1}. Taksit`,
                                customerId: customerId,
                                branch: branch || 'Merkez'
                                // Eğer imza senet ise OTP flow olacak, ama o farklı bir tabloda ele alınabilir veya durum `İmzaya Sunulacak` yapılabilir. Şimdilik Beklemede kalıyor.
                            }
                        });
                    }

                    // We optionally create a transaction for receiving the Check/Senet 
                    // so it shows up in "Finansal Hareketler" as well.
                    await tx.transaction.create({
                        data: {
                            companyId: company.id,
                            type: type === 'Senet' ? 'Senet' : 'Check',
                            amount: total, // Total amount of checks/senets received
                            description: `${count} Adet ${type} Alındı - ${title}`,
                            date: start,
                            branch: branch || 'Merkez',
                            customerId: customerId
                        }
                    });
                    
                    // Receiving Check/Senet pays off the open balance
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { balance: { decrement: total } }
                    });
                }
            }

            if (!isExisting) {
                // 2. Payables (Vadeli Borç/Mal Alımı) -> Tedarikçiye Borçlanırız
                if (direction === 'OUT' && supplierId) {
                    // Create Purchase Transaction
                    await tx.transaction.create({
                        data: {
                            companyId: company.id, // Set Company ID
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

            if (direction === 'OUT' && supplierId) {
                if (type === 'Çek' || type === 'Senet') {
                    // For each installment, create a Check/Senet record
                    for (let i = 0; i < count; i++) {
                        const dueDate = new Date(start);
                        dueDate.setMonth(dueDate.getMonth() + i);
                        const amount = i === count - 1 ? monthlyAmount + remainder : monthlyAmount;
                        
                        await tx.check.create({
                            data: {
                                companyId: company.id,
                                type: type === 'Senet' ? 'Senet (Verilen)' : 'Çek (Verilen)',
                                number: `PLN-${Date.now().toString().slice(-6)}-${i+1}`,
                                dueDate: dueDate,
                                amount: amount,
                                status: 'Beklemede',
                                description: `${title} - ${i+1}. Taksit`,
                                supplierId: supplierId,
                                branch: branch || 'Merkez'
                            }
                        });
                    }

                    await tx.transaction.create({
                        data: {
                            companyId: company.id,
                            type: type === 'Senet' ? 'Senet' : 'Check', // Treat as payment going out
                            amount: total,
                            description: `${count} Adet ${type} Verildi - ${title}`,
                            date: start,
                            branch: branch || 'Merkez',
                            supplierId: supplierId
                        }
                    });
                    
                    // Giving a check/senet pays our debt, increasing the supplier balance back
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: { balance: { increment: total } }
                    });
                }
            }

            return newPlan;
        });

        return NextResponse.json({ success: true, plan });

    } catch (error: any) {
        console.error('Payment Plan Create Error:', error);
        return NextResponse.json({ error: 'Plan oluşturulamadı: ' + error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        // SECURITY: Tenant Isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company && session.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');

        const whereClause: any = {};
        if (company) {
            whereClause.companyId = company.id;
        }

        if (branch && branch !== 'Tümü' && branch !== 'Merkez') {
            /* whereClause.branch = branch; */
        }

        const plans = await (prisma as any).paymentPlan.findMany({
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
