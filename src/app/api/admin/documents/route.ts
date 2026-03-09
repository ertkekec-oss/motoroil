import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const documents = await prisma.platformDocument.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { approvals: true }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error('[Admin Documents GET Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');
        const documentNo = formData.get('documentNo') as string;
        const title = formData.get('title') as string;
        const category = formData.get('category') as any;
        const targetModule = formData.get('targetModule') as any;
        const approvalMethod = formData.get('approvalMethod') as any;

        if (!documentNo || !title || !(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'Missing required fields or file' }, { status: 400 });
        }

        if (fileEntry.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        let cleanName = (fileEntry.name || 'document.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '');
        const s3Key = `platform-documents/${randomUUID()}-${cleanName}`;
        const buffer = Buffer.from(await fileEntry.arrayBuffer());

        await uploadToS3({
            bucket: 'public', // Platform documents are usually public for reading
            key: s3Key,
            body: buffer,
            contentType: fileEntry.type,
            cacheControl: "public, max-age=31536000"
        });

        const doc = await prisma.platformDocument.create({
            data: {
                documentNo,
                title,
                category,
                targetModule,
                approvalMethod,
                fileKey: s3Key,
                version: 1,
            }
        });

        return NextResponse.json(doc);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A document with this Document Number already exists.' }, { status: 400 });
        }
        console.error('[Admin Documents POST Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
