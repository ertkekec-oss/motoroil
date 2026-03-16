import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { getPayrollParams, calculateGrossToNet, calculateNetToGross } from '@/lib/payrollEngine';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // e.g. "2024-02"
    const branch = searchParams.get('branch');
    const staffId = searchParams.get('staffId');

    const where: any = {};
    if (period) where.period = period;
    if (staffId) where.staffId = staffId;

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
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { period, staffIds } = body;

        if (!period) return NextResponse.json({ success: false, error: 'Dönem girilmelidir' }, { status: 400 });

        const [year, month] = period.split('-').map(Number);
        const payrollParams = await getPayrollParams(year);
        
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59);

        let processed = 0;

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

            if (exists && exists.isLocked) {
                continue; // Kilitli bordrolar tekrar hesaplanmaz, atla.
            }

            // 1. Calculate bonuses
            let bonusSgkExempt = 0;
            let bonusTaxable = 0;

            const periodTargets = await (prisma as any).staffTarget.findMany({
                where: {
                    staffId: staff.id,
                    startDate: { lte: periodEnd },
                    endDate: { gte: periodStart },
                    status: 'ACTIVE'
                }
            });

            for (const target of periodTargets) {
                let currentValue = 0;
                let targetBonusVal = 0;

                if (target.type === 'TURNOVER') {
                    const fieldAgg = await (prisma as any).salesOrder.aggregate({
                        where: {
                            staffId: staff.id,
                            createdAt: { gte: target.startDate, lte: target.endDate },
                            status: { not: 'CANCELLED' }
                        },
                        _sum: { totalAmount: true }
                    });
                    const storeAgg = await (prisma as any).order.aggregate({
                        where: {
                            staffId: staff.id,
                            orderDate: { gte: target.startDate, lte: target.endDate },
                            status: { notIn: ['CANCELLED', 'Returned'] }
                        },
                        _sum: { totalAmount: true }
                    });
                    currentValue = Number(fieldAgg._sum?.totalAmount || 0) + Number(storeAgg._sum?.totalAmount || 0);

                    if (target.commissionRate > 0) {
                        targetBonusVal += (currentValue * Number(target.commissionRate)) / 100;
                    }
                } else if (target.type === 'VISIT') {
                    currentValue = await (prisma as any).salesVisit.count({
                        where: {
                            staffId: staff.id,
                            checkInTime: { gte: target.startDate, lte: target.endDate }
                        }
                    });
                }

                if (currentValue >= Number(target.targetValue) && target.bonusAmount > 0) {
                    targetBonusVal += Number(target.bonusAmount);
                }

                if (targetBonusVal > 0) {
                    if (target.isSgkExempt) {
                        bonusSgkExempt += targetBonusVal;
                    } else {
                        bonusTaxable += targetBonusVal;
                    }
                }
            }

            const totalBonus = bonusSgkExempt + bonusTaxable;

            // 2. Kıstelyevm ve PDKS (Çalışılan Gün) Kontrolü
            let workedDays = 30;
            if (staff.entryDate && new Date(staff.entryDate) > periodStart) {
                const msDiff = periodEnd.getTime() - new Date(staff.entryDate).getTime();
                workedDays = Math.ceil(msDiff / (1000 * 3600 * 24));
                if (workedDays > 30) workedDays = 30; // Max 30 SGK günü
            }
            if (staff.leaveDate && new Date(staff.leaveDate) < periodEnd) {
                let startDateToUse = periodStart;
                if (staff.entryDate && new Date(staff.entryDate) > periodStart) startDateToUse = new Date(staff.entryDate);
                const msDiff = new Date(staff.leaveDate).getTime() - startDateToUse.getTime();
                workedDays = Math.ceil(msDiff / (1000 * 3600 * 24)) + 1;
                if (workedDays > 30) workedDays = 30;
            }

            // TODO: PDKS devamsızlık düşülebilir (gelecekte).
            
            // 3. Maaş Hesaplama Motoru (GROSS vs NET)
            const baseSalary = Number(staff.salary || 0);
            let pResult;

            if (staff.salaryType === 'GROSS') {
                // Brüt Anlaşma: Hedeflenen Primler brütmüş gibi varsayılır.
                const totalGross = baseSalary + bonusTaxable;
                pResult = calculateGrossToNet(totalGross, payrollParams, workedDays, 0);
                
                // Prim SGK İstisnası varsa, o kısım vergiden/sgk'dan muaf salt eklenir.
                pResult.net += bonusSgkExempt; 
                pResult.gross += bonusSgkExempt;
            } else {
                // Net Anlaşma: Taban maaş net. Tabana primler varsa net prim olarak ekle.
                const totalTargetNet = baseSalary + totalBonus;
                // Netten brüte tersten giderek bul.
                pResult = calculateNetToGross(totalTargetNet, payrollParams, workedDays, 0);
            }

            const data = {
                staffId: staff.id,
                period,
                salary: baseSalary,
                grossSalary: pResult.gross,
                sgkDeduction: pResult.sgkDeduction,
                incomeTax: pResult.incomeTax,
                stampTax: pResult.stampTax,
                workedDays: workedDays,
                bonus: totalBonus,
                deductions: 0, // Manuel girilecekler için
                netPay: pResult.net,
                status: exists ? exists.status : 'Bekliyor'
            };

            if (exists && !exists.isLocked) {
                await prisma.payroll.update({
                    where: { id: exists.id },
                    data: data
                });
            } else if (!exists) {
                await prisma.payroll.create({
                    data: data
                });
            }
            processed++;
        }

        return NextResponse.json({ success: true, message: `${processed} adet bordro hesaplandı/güncellendi.` });

    } catch (error: any) {
        console.error("Payroll Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { id, status, deductions, note } = body;

        if (!id) return NextResponse.json({ success: false, error: 'Bordro ID gerekli' }, { status: 400 });

        const existing = await prisma.payroll.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 });

        if (existing.isLocked) {
           return NextResponse.json({ success: false, error: 'Bu bordro ödendi(kilitli) olduğu için düzenlenemez. Düzeltmeler yeni aya yansıtılmalıdır.' }, { status: 400 });
        }

        let isLocked = false;
        let paidAt = existing.paidAt;

        if (status === 'İşlendi' || status === 'Ödendi') {
            isLocked = true; // Resmi kapanış kilidi
            if (!paidAt) paidAt = new Date();
        }

        // Netpay recalculation dynamically if deductions manually overridden
        let newNetPay = Number(existing.netPay);
        if (deductions !== undefined) {
             const diff = Number(deductions) - Number(existing.deductions);
             newNetPay -= diff;
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: {
                status: status !== undefined ? status : existing.status,
                note: note !== undefined ? note : existing.note,
                deductions: deductions !== undefined ? Number(deductions) : existing.deductions,
                netPay: newNetPay,
                isLocked,
                paidAt
            }
        });

        return NextResponse.json({ success: true, payroll: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
