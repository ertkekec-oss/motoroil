
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const staffId = searchParams.get('staffId');

        if (!staffId) {
            return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
        }

        const documents = await prisma.staffDocument.findMany({
            where: { staffId },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                staffId: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                uploadedAt: true,
                fileData: true
            }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { staffId, fileName, fileType, fileSize, fileData } = body;

        if (!staffId || !fileData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const document = await prisma.staffDocument.create({
            data: {
                staffId,
                fileName,
                fileType,
                fileSize,
                fileData
            }
        });

        return NextResponse.json(document);
    } catch (error: any) {
        console.error('Error uploading document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        await prisma.staffDocument.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
