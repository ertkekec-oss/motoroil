import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const body = await request.json();
        
        // Ensure ID is defined
        if (!params.id || params.id === 'undefined') {
             return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        const product = await prisma.product.update({
            where: { id: params.id },
            data: body
        });
        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        
        if (!params.id || params.id === 'undefined') {
             return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        await prisma.product.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}