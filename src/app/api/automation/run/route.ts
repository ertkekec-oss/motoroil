
import { NextRequest, NextResponse } from 'next/server';
import { runDailyAutomation } from '@/lib/automation-engine';

export async function GET(req: NextRequest) {
    try {
        const cronSecret = req.headers.get('x-cron-secret');
        const internalSecret = process.env.CRON_SECRET || 'periodya_internal_automation_secret_2026';

        if (cronSecret !== internalSecret && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await runDailyAutomation();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error: any) {
        console.error("Automation Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
