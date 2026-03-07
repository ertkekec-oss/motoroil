import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { EscrowPolicyEngine } from '@/services/network/financeRisk/escrowPolicyEngine';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { escrowHoldId, buyerTenantId, sellerTenantId } = body;

        if (!escrowHoldId || !buyerTenantId || !sellerTenantId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const policy = await EscrowPolicyEngine.buildEscrowPolicyDecision(escrowHoldId, { buyerTenantId, sellerTenantId });

        return NextResponse.json({ success: true, policyType: policy.decisionType });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
