
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // products or transfers

        if (type === 'products') {
            const pending = await prisma.pendingProduct.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(pending);
        } else if (type === 'transfers') {
            const pending = await prisma.pendingTransfer.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(pending);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { type, ...payload } = data;

        if (type === 'product') {
            const pending = await prisma.pendingProduct.create({
                data: {
                    productData: payload.productData,
                    requestedBy: payload.requestedBy
                }
            });
            return NextResponse.json(pending);
        } else if (type === 'transfer') {
            const pending = await prisma.pendingTransfer.create({
                data: {
                    transferData: payload.transferData,
                    requestedBy: payload.requestedBy
                }
            });
            return NextResponse.json(pending);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, type, status } = data;

        if (type === 'product') {
            const pending = await prisma.pendingProduct.update({
                where: { id },
                data: { status }
            });
            return NextResponse.json(pending);
        } else if (type === 'transfer') {
            const pending = await prisma.pendingTransfer.update({
                where: { id },
                data: { status }
            });
            return NextResponse.json(pending);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
