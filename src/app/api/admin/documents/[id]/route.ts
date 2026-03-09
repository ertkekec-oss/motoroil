import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;

        const doc = await prisma.platformDocument.findUnique({
            where: { id },
            include: {
                approvals: {
                    include: {
                        document: {
                            select: { title: true }
                        }
                    },
                    orderBy: { approvedAt: 'desc' }
                }
            }
        });

        if (!doc) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        return NextResponse.json(doc);
    } catch (e) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        const documentNo = formData.get('documentNo') as string;
        const title = formData.get('title') as string;
        const category = formData.get('category') as any;
        const targetModule = formData.get('targetModule') as any;
        const approvalMethod = formData.get('approvalMethod') as any;
        const isActive = formData.get('isActive') === 'true';
        const fileEntry = formData.get('file');

        const existingDoc = await prisma.platformDocument.findUnique({ where: { id } });
        if (!existingDoc) return NextResponse.json({ error: 'Doc not found' }, { status: 404 });

        let fileKey = existingDoc.fileKey;
        let version = existingDoc.version;
        let revisedAt = existingDoc.revisedAt;

        if (fileEntry instanceof File && fileEntry.size > 0) {
            if (fileEntry.type !== 'application/pdf') {
                return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 });
            }
            let cleanName = (fileEntry.name || 'document.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '');
            const s3Key = `platform-documents/${randomUUID()}-${cleanName}`;
            const buffer = Buffer.from(await fileEntry.arrayBuffer());

            await uploadToS3({
                bucket: 'public',
                key: s3Key,
                body: buffer,
                contentType: fileEntry.type,
                cacheControl: "public, max-age=31536000"
            });
            fileKey = s3Key;
            version += 1; // Increment version due to new file
            revisedAt = new Date();
        }

        const doc = await prisma.platformDocument.update({
            where: { id },
            data: {
                documentNo,
                title,
                category,
                targetModule,
                approvalMethod,
                isActive,
                fileKey,
                version,
                revisedAt
            }
        });

        return NextResponse.json(doc);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'Document No already exists.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
