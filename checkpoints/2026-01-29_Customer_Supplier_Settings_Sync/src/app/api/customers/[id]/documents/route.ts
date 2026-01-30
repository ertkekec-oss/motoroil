
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        const documents = await prisma.customerDocument.findMany({
            where: { customerId: id },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                uploadedAt: true,
                // Don't fetch fileData in list to save bandwidth
            }
        });

        return NextResponse.json({ success: true, documents });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { fileName, fileType, fileData, fileSize } = body;

        if (!fileName || !fileData) {
            return NextResponse.json({ success: false, error: 'Dosya verisi eksik.' }, { status: 400 });
        }

        // Size limit check (e.g. 4MB approx for base64 string length)
        if (fileData.length > 5 * 1024 * 1024 * 1.33) {
            return NextResponse.json({ success: false, error: 'Dosya boyutu çok büyük (Max 5MB).' }, { status: 400 });
        }

        const doc = await prisma.customerDocument.create({
            data: {
                customerId: id,
                fileName,
                fileType,
                fileSize,
                fileData
            }
        });

        return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        // Here id is customerId, but we need documentId. 
        // We'll pass documentId in searchParams or use a separate route.
        // Let's use searchParams for simplicity in this file structure or creating a new [docId] route.
        // Better: src/app/api/documents/[docId]/route.ts for deletion.

        // For now, let's just return error as this route is for the collection.
        return NextResponse.json({ success: false, error: 'Method not allowed on collection' }, { status: 405 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
