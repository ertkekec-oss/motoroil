import { NextResponse } from 'next/server';
import { SalesPerformanceEngine } from '@/services/hr/performance/engine';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        const staffId = user.id; // Or how staff is mapped in Periodya

        // Simply call our new engine
        const data = await SalesPerformanceEngine.getDashboardData(staffId);

        // Map into standard UI structure
        return NextResponse.json({
            success: true,
            data: {
                assignments: data.assignments,
                achievements: data.badges.map(b => b.badgeType),
                leaderboard: data.leaderboard || { rank: '-', scoreValue: 0 },
                stats: {
                    target: '1.000.000,00 ₺',
                    actual: '1.150.000,00 ₺',
                    achievement: '%115',
                    bonus: '45.000,00 ₺'
                },
                aiSuggested: {
                    safe: '1.200.000 ₺',
                    balanced: '1.450.000 ₺',
                    aggressive: '1.800.000 ₺'
                }
            }
        });
    } catch (error: any) {
        console.error('HR Performance Engine Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
