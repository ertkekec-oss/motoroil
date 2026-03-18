import { NextResponse } from 'next/server';
import { SalesPerformanceEngine } from '@/services/hr/performance/engine';
import { authorize, getStaffIdFromSession } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;
        const companyId = user.companyId || user.impersonateCompanyId;

        const staffId = await getStaffIdFromSession(user);
        
        let data = await SalesPerformanceEngine.getDashboardData(staffId || user.id);

        if (data.assignments.length === 0) {
            const targetId = staffId || user.id;
            await SalesPerformanceEngine.bootstrapMatrixForStaff(tenantId, companyId, targetId);
            data = await SalesPerformanceEngine.getDashboardData(targetId);
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
