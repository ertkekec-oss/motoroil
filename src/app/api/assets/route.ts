import { NextResponse } from 'next/response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.asset.findMany({
            where: { companyId: session.user.companyId },
            include: {
                assignments: {
                    include: { staff: true },
                    orderBy: { assignedAt: 'desc' },
                    take: 1
                },
                maintenances: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: assets });
    } catch (error) {
        console.error('API Error - GET Assets:', error);
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
        const { name, category, serialNumber, purchasePrice, purchaseDate, branch } = body;

        const barcodeData = `P-AST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const newAsset = await prisma.asset.create({
            data: {
                companyId: session.user.companyId,
                name: name || 'Yeni Demirbaş',
                category: category || 'Elektronik',
                serialNumber: serialNumber || null,
                barcode: barcodeData,
                purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                branch: branch || session.user.branch || 'Merkez',
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({ success: true, data: newAsset });
    } catch (error) {
        console.error('API Error - POST Asset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
