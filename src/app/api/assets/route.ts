import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const user = (auth as any).user;
        const companyId = user.companyId || user.tenantId;

        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.asset.findMany({
            where: { companyId },
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
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const user = (auth as any).user;
        const companyId = user.companyId || user.tenantId;

        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, category, serialNumber, purchasePrice, purchaseDate, branch } = body;

        const barcodeData = `P-AST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const newAsset = await prisma.asset.create({
            data: {
                companyId,
                name: name || 'Yeni Demirbaş',
                category: category || 'Elektronik',
                serialNumber: serialNumber || null,
                barcode: barcodeData,
                purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                branch: branch || user.branch || 'Merkez',
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({ success: true, data: newAsset });
    } catch (error) {
        console.error('API Error - POST Asset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
