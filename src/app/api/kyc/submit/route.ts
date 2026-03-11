import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { uploadToS3 } from '@/lib/s3';

export async function POST(req: NextRequest) {
    try {
        const { userId, tenantId, companyId } = await getRequestContext(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        
        const formData = await req.formData();
        
        const requirementId = formData.get('requirementId') as string;
        const file = formData.get('file') as File;

        if (!requirementId || !file) {
            return NextResponse.json({ success: false, error: 'File and requirement payload needed' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `kyc/${tenantId}/${requirementId}-${Date.now()}-${file.name}`;

        // Just blindly try upload
        await uploadToS3({
            bucket: 'private',
            body: buffer,
            key,
            contentType: file.type
        });
        
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Upsert Submission
        const submission = await prisma.tenantRequirementSubmission.upsert({
            where: {
                tenantId_requirementId: {
                    tenantId,
                    requirementId
                }
            },
            create: {
                tenantId,
                userId,
                requirementId,
                status: 'PENDING',
                documentKey: key,
                documentUrl: s3Url
            },
            update: {
                userId,
                status: 'PENDING',
                documentKey: key,
                documentUrl: s3Url,
                rejectionReason: null
            }
        });

        return NextResponse.json({ success: true, submission });
    } catch (error: any) {
        console.error('KYC Document Submission Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
