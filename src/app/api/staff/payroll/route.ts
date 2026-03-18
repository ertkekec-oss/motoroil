import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { getPayrollParams, calculateGrossToNet, calculateNetToGross } from '@/lib/payrollEngine';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // e.g. "2024-02"
    const branch = searchParams.get('branch');
    const staffId = searchParams.get('staffId');
    const mine = searchParams.get('mine');

    const where: any = {};
    if (period) where.period = period;
    
    if (mine === 'true') {
        const { getSession } = await import('@/lib/auth');
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (session) {
            const staffUser = await (prisma as any).staff.findFirst({
                where: {
                    OR: [
                        { email: session.email },
                        { username: session.username || session.email }
                    ]
                }, select: { id: true }
            });
            if (staffUser) where.staffId = staffUser.id;
        }
    } else if (staffId) {
        where.staffId = staffId;
    }

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

            // 2. Kıstelyevm (Çalışılan Gün) Kontrolü
            let workedDays = 30;
            
            const staffEntry = staff.entryDate ? new Date(staff.entryDate) : null;
            const staffLeave = staff.leaveDate ? new Date(staff.leaveDate) : null;
            
            if (staffEntry && staffEntry > periodStart && staffEntry <= periodEnd) {
                const msDiff = periodEnd.getTime() - staffEntry.getTime();
                workedDays = Math.ceil(msDiff / (1000 * 3600 * 24)) + 1;
            }
            
            if (staffLeave && staffLeave < periodEnd && staffLeave >= periodStart) {
                const startDateToUse = (staffEntry && staffEntry > periodStart) ? staffEntry : periodStart;
                const msDiff = staffLeave.getTime() - startDateToUse.getTime();
                workedDays = Math.ceil(msDiff / (1000 * 3600 * 24)) + 1;
            }
            if (workedDays > 30) workedDays = 30;

            // PDKS Devamsızlık ve Ücretsiz İzin Kesintileri
            const leaveRequests = await prisma.leaveRequest.findMany({
                where: {
                    staffId: staff.id,
                    status: 'Onaylandı',
                    type: 'Ücretsiz İzin',
                    startDate: { lte: periodEnd },
                    endDate: { gte: periodStart }
                }
            });

            let unpaidLeaveDays = 0;
            for (const lr of leaveRequests) {
                const overlapStart = lr.startDate > periodStart ? lr.startDate : periodStart;
                const overlapEnd = lr.endDate < periodEnd ? lr.endDate : periodEnd;
                const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
                let overlapDays = Math.ceil(overlapMs / (1000 * 3600 * 24)) + 1;
                if (overlapDays > 0) unpaidLeaveDays += overlapDays;
            }

            const absences = await prisma.attendance.count({
                where: {
                    staffId: staff.id,
                    date: { gte: periodStart, lte: periodEnd },
                    status: 'ABSENT' 
                }
            });

            workedDays -= (unpaidLeaveDays + absences);
            if (workedDays < 0) workedDays = 0;
            
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

            // 4. Avans ve Kesintileri Düş
            const advances = await prisma.advanceDeduction.findMany({
                where: {
                    staffId: staff.id,
                    period: period,
                    status: 'APPROVED'
                }
            });

            let totalAdvanceDeductions = 0;
            for (const adv of advances) {
                totalAdvanceDeductions += Number(adv.amount);
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
                deductions: totalAdvanceDeductions, // Otomatik olarak sistemdeki avans/kesintiler uygulanır
                netPay: Math.max(0, pResult.net - totalAdvanceDeductions), // Net eksi avanslar
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
