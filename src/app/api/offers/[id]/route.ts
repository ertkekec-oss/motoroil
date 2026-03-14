import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: { customer: true, lines: true, terms: true }
        });
        if (!offer) return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
        
        // Format for frontend compatibility initially
        const formattedOffer = {
            ...offer,
            quoteNo: offer.offerNumber,
            date: offer.issueDate,
            totalAmount: offer.grandTotal,
            subTotal: offer.subtotal,
            taxAmount: offer.taxTotal,
            description: offer.terms?.[0]?.notes || '',
            items: offer.lines.map(l => ({
                id: l.id,
                productId: l.productId,
                name: l.description,
                quantity: l.quantity,
                price: l.unitPrice,
                taxRate: l.taxRate
            }))
        };

        return NextResponse.json({ success: true, quote: formattedOffer, offer });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: paramId } = await params;
    try {
        const body = await req.json();
        const { items, description, validUntil, subTotal, taxAmount, totalAmount, status, customerId } = body;

        // Start transaction for update
        const offer = await prisma.$transaction(async (tx) => {
            await tx.offerLine.deleteMany({ where: { offerId: paramId } });
            
            const lines = (items || []).map((item: any) => ({
                productId: item.productId || null,
                description: item.name || "",
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.price) || 0,
                taxRate: Number(item.taxRate) || 0,
                taxAmount: (Number(item.quantity) * Number(item.price)) * (Number(item.taxRate)/100) || 0,
                lineTotal: (Number(item.quantity) * Number(item.price)) + ((Number(item.quantity) * Number(item.price)) * (Number(item.taxRate)/100)) || 0
            }));

            // Check if terms exist
            const existingTerms = await tx.offerTerm.findUnique({ where: { offerId: paramId } });

            const updatedOffer = await tx.offer.update({
                where: { id: paramId },
                data: {
                    customerId,
                    validUntil: validUntil ? new Date(validUntil) : null,
                    subtotal: Number(subTotal) || 0,
                    taxTotal: Number(taxAmount) || 0,
                    grandTotal: Number(totalAmount) || 0,
                    status: status || undefined,
                    lines: { create: lines },
                    terms: existingTerms 
                        ? { update: { notes: description || '' } } 
                        : { create: { notes: description || '' } }
                },
                include: { lines: true, terms: true }
            });
            return updatedOffer;
        });

        return NextResponse.json({ success: true, quote: offer });
    } catch (error: any) {
        console.error("error updating offer", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.offer.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
