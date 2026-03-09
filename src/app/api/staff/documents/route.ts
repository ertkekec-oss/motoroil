
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(request.url);
        const staffId = searchParams.get('staffId');

        const user = (auth as any).user;
        const tenantId = user.impersonateTenantId || user.tenantId;
        const isPlatformAdmin = user.role === 'SUPER_ADMIN' || tenantId === 'PLATFORM_ADMIN';

        const where: any = {};
        if (staffId) where.staffId = staffId;

        if (!isPlatformAdmin) {
            where.staff = {
                tenantId: tenantId
            };
        }

        const documents = await prisma.staffDocument.findMany({
            where,
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                staffId: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                uploadedAt: true,
                fileData: true,
                staff: {
                    select: {
                        name: true,
                        role: true
                    }
                }
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
