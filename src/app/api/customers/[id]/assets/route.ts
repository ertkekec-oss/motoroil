import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;
        const assets = await prisma.customerAsset.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(assets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;
        const body = await request.json();
        
        // Ensure companyId is implicitly handled if possible, or fetch via customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });
        
        if (!customer) throw new Error("Müşteri bulunamadı");

        const asset = await prisma.customerAsset.create({
            data: {
                companyId: customer.companyId,
                customerId,
                assetType: body.assetType || 'VEHICLE',
                primaryIdentifier: body.primaryIdentifier,
                secondaryIdentifier: body.secondaryIdentifier,
                brand: body.brand,
                model: body.model,
                productionYear: body.productionYear ? Number(body.productionYear) : null,
                metadata: body.metadata || {}
            }
        });

        return NextResponse.json(asset);
    } catch (error: any) {
        console.error('Asset creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
