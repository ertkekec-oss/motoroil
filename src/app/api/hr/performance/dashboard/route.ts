import { NextResponse } from 'next/server';
import { SalesPerformanceEngine } from '@/services/hr/performance/engine';
import { authorize, getStaffIdFromSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = auth.user;
        const staffId = await getStaffIdFromSession(user);
        
        // Ensure tenantId and companyId are robustly fetched from Staff record
        let staffRecord = null;
        if (staffId) {
            staffRecord = await prisma.staff.findUnique({ where: { id: staffId }, select: { tenantId: true, companyId: true, id: true } });
        } else if (user.id) {
            staffRecord = await prisma.staff.findUnique({ where: { userId: user.id }, select: { tenantId: true, companyId: true, id: true } });
        }
        
        const tenantId = staffRecord?.tenantId || user.impersonateTenantId || user.tenantId;
        const companyId = staffRecord?.companyId || user.companyId || user.impersonateCompanyId;
        const targetTargetId = staffRecord?.id || staffId || user.id;

        if (!tenantId || !companyId || !targetTargetId) {
            return NextResponse.json({ error: "Context (tenant, company, or target id) missing" }, { status: 400 });
        }

        let data = await SalesPerformanceEngine.getDashboardData(targetTargetId);

        if (data.assignments.length === 0) {
            await SalesPerformanceEngine.bootstrapMatrixForStaff(tenantId, companyId, targetTargetId);
            data = await SalesPerformanceEngine.getDashboardData(targetTargetId);
        }

        const formatCurr = (val: any) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(val));

        return NextResponse.json({
            success: true,
            data: {
                assignments: data.assignments,
                achievements: data.badges.map(b => b.badgeType),
                leaderboard: data.leaderboard || { rankGlobal: '-', scoreValue: 0 },
                stats: {
                    target: formatCurr(data.stats.totalTarget),
                    actual: formatCurr(data.stats.totalActual),
                    achievement: `%${data.stats.achievementRatio.toFixed(1)}`,
                    bonus: formatCurr(data.stats.totalBonus)
                },
                aiSuggested: {
                    safe: formatCurr(Number(data.stats.totalTarget) * 1.05),
                    balanced: formatCurr(Number(data.stats.totalTarget) * 1.12),
                    aggressive: formatCurr(Number(data.stats.totalTarget) * 1.25)
                }
            }
        });
    } catch (error: any) {
        console.error('HR Performance Engine Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
