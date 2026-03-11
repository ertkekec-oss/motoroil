import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId, role } = await getRequestContext(req);
        // check if admin
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const submissionId = id;
        const data = await req.json();
        const { action, reason } = data; // action: 'APPROVE' or 'REJECT'

        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        const submission = await prisma.tenantRequirementSubmission.findUnique({
            where: { id: submissionId },
            include: { requirement: true }
        });

        if (!submission) {
            return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
        }

        let expiresAt = null;
        if (action === 'APPROVE' && submission.requirement.validityMonths) {
            const date = new Date();
            date.setMonth(date.getMonth() + submission.requirement.validityMonths);
            expiresAt = date;
        }

        const updated = await prisma.tenantRequirementSubmission.update({
            where: { id: submissionId },
            data: {
                status,
                rejectionReason: action === 'REJECT' ? reason : null,
                expiresAt: expiresAt
            }
        });

        return NextResponse.json({ success: true, submission: updated });
    } catch (error: any) {
        console.error('Review submission error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
