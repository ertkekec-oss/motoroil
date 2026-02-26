import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '../../../../../../../services/admin/finance/guard';
import { adminOverrideEarningRelease } from '../../../../../../../services/admin/finance/earnings';
import { releaseSingleEarning } from '../../../../../../../services/finance/earnings/releaseSingle';

interface RouteParams {
    params: {
        earningId: string;
    };
}

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const user = await requirePlatformFinanceAdmin(req);
        if (!user || !user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { reason } = body;

        // 1. Mark earning as eligible immediately and audit log
        await adminOverrideEarningRelease(user.id, params.earningId, reason);

        // 2. Actually execute the release engine process
        await releaseSingleEarning(params.earningId);

        return NextResponse.json({
            success: true,
            message: 'Earning successfully released.'
        });

    } catch (error: any) {
        if (error.message === 'ALREADY_SUCCEEDED') {
            return NextResponse.json({
                success: true,
                message: 'Earning override was already performed.'
            });
        }
        if (error.name === 'AlreadyRunningError' || error.message.includes('already running')) {
            return NextResponse.json({ error: 'Release in progress. Try again soon.' }, { status: 409 });
        }
        if (error.message.includes('not found') || error.name === 'NotFoundError') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.name === 'ValidationError' || error.message.includes('Cannot release')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        // In case the base engine fails
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
