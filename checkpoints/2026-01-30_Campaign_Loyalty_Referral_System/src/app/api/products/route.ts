
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code, barcode, brand, category, type, stock, price, buyPrice, supplier, branch,
            salesVat, salesVatIncluded, purchaseVat, purchaseVatIncluded,
            salesOiv, salesOtv, otvType } = body;

        const product = await prisma.product.create({
            data: {
                name,
                code: code || `SKU-${Date.now()}`,
                barcode: barcode || '',
                brand: brand || '',
                category: category || 'Genel',
                type: type || 'Ürün',
                stock: parseFloat(stock) || 0,
                price: parseFloat(price) || 0,
                buyPrice: parseFloat(buyPrice) || 0,
                supplier: supplier || '',
                branch: branch || 'Merkez',
                salesVat: parseInt(salesVat) || 20,
                salesVatIncluded: salesVatIncluded !== undefined ? salesVatIncluded : true,
                purchaseVat: parseInt(purchaseVat) || 20,
                purchaseVatIncluded: purchaseVatIncluded !== undefined ? purchaseVatIncluded : true,
                salesOiv: parseFloat(salesOiv) || 0,
                salesOtv: parseFloat(salesOtv) || 0,
                otvType: otvType || 'Ö.T.V yok'
            }
        });

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('Product create error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
