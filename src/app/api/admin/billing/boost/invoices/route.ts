import { NextRequest, NextResponse } from 'next/server';
import { issueBoostInvoice, markBoostInvoicePaid } from '../../../../services/billing/boost/invoices';
import { requirePlatformFinanceAdmin } from '../../../../lib/auth/financeGuard';

export async function POST(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);
        
        const { action, subscriptionId, periodKey, invoiceId } = await req.json();
        
        if (action === 'ISSUE') {
            if (!subscriptionId || !periodKey) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
            const inv = await issueBoostInvoice({ adminUserId: 'API_ADMIN', subscriptionId, periodKey });
            return NextResponse.json({ success: true, invoice: inv });
        }
        
        if (action === 'PAY') {
            if (!invoiceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
            const inv = await markBoostInvoicePaid({ adminUserId: 'API_ADMIN', invoiceId });
            return NextResponse.json({ success: true, invoice: inv });
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch(e) {
         const err = e as Error;
         return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
