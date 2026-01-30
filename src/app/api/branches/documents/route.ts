import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all documents for a branch
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        if (!branchId) throw new Error('Branch ID is required');

        const docs = await prisma.branchDocument.findMany({
            where: { branchId: parseInt(branchId) },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                branchId: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                uploadedAt: true,
                // We don't return fileData in the list for performance
            }
        });
        return NextResponse.json(docs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPLOAD a document
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const doc = await prisma.branchDocument.create({
            data: {
                branchId: parseInt(data.branchId),
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                fileData: data.fileData
            }
        });
        return NextResponse.json(doc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a document
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('ID is required');

        await prisma.branchDocument.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
