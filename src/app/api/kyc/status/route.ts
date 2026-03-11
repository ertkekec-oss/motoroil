import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const { userId, tenantId, companyId } = await getRequestContext(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const moduleId = searchParams.get('moduleId');

        const activeRequirements = moduleId ? 
            await prisma.platformRequirement.findMany({
                where: { isActive: true, moduleId },
                include: { contract: true }
            }) :
            await prisma.platformRequirement.findMany({
                where: { isActive: true },
                include: { contract: true }
            });

        // Current tenant submissions
        const userSubmissions = await prisma.tenantRequirementSubmission.findMany({
            where: { tenantId }
        });

        // Current user/tenant signatures
        const signatures = await prisma.tenantContractSignature.findMany({
            where: { tenantId, userId: userId }
        });

        const statusArray = activeRequirements.map(req => {
            let isFulfilled = false;
            let status = 'MISSING';
            let detail = null;

            if (req.type === 'DOCUMENT') {
                const sub = userSubmissions.find(s => s.requirementId === req.id);
                if (sub) {
                    status = sub.status; // PENDING, APPROVED, REJECTED, EXPIRED
                    isFulfilled = sub.status === 'APPROVED';
                    detail = sub;
                }
            } else if (req.type === 'CONTRACT' && req.contractId) {
                // Must have signed the latest version
                const latestVersion = req.contract?.version || 1;
                const sig = signatures.find(s => s.contractId === req.contractId && s.version === latestVersion);
                if (sig) {
                    status = 'SIGNED';
                    isFulfilled = true;
                    detail = sig;
                }
            }

            return {
                requirement: req,
                status,
                isFulfilled,
                detail
            };
        });

        const isModuleActive = statusArray.length === 0 ? true : statusArray.every(s => s.isFulfilled);

        return NextResponse.json({ 
            success: true, 
            isModuleActive, 
            requirements: statusArray 
        });

    } catch (error: any) {
        console.error('KYC Status Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
