import { NextResponse } from 'next/response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assignments = await prisma.assetAssignment.findMany({
            where: { companyId: session.user.companyId },
            include: {
                asset: true,
                staff: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: assignments });
    } catch (error) {
        console.error('API Error - GET AssetAssignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assetId, staffId, notes } = body;

        if (!assetId || !staffId) {
            return NextResponse.json({ error: 'Asset ID ve Staff ID zorunludur' }, { status: 400 });
        }

        // Önceki aktif zimmetleri kapat (Returned)
        await prisma.assetAssignment.updateMany({
            where: {
                assetId,
                status: 'ACTIVE'
            },
            data: {
                status: 'RETURNED',
                returnedAt: new Date()
            }
        });

        // Yeni zimmet oluştur
        const newAssignment = await prisma.assetAssignment.create({
            data: {
                companyId: session.user.companyId,
                assetId,
                staffId,
                notes,
                status: 'ACTIVE',
                // Gerçek senaryoda bu true olmaz, PDF onayı beklenir.
                // Biz demo gereği OTP ile onaylandığını varsayacağız.
                isSigned: false 
            },
            include: {
                asset: true,
                staff: true
            }
        });

        return NextResponse.json({ success: true, data: newAssignment });
    } catch (error) {
        console.error('API Error - POST AssetAssignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
