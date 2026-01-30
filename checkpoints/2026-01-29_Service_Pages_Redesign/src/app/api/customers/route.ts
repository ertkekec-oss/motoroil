
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                category: true,
                transactions: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Frontend ile uyumlu formata dönüştür
        const formattedCustomers = customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            branch: c.branch || 'Merkez',
            balance: Number(c.balance || 0),
            category: c.category?.name || 'Genel',
            email: c.email || '',
            address: c.address || '',
            lastVisit: c.updatedAt.toISOString().split('T')[0]
        }));

        return NextResponse.json({ success: true, customers: formattedCustomers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, address, taxNumber, taxOffice, categoryId, contactPerson, iban, branch } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Müşteri adı zorunludur.' }, { status: 400 });
        }

        // Genel kategori otomatik seçilsin mi? Eğer categoryId gönderilmezse:
        let targetCategoryId = categoryId;
        if (!targetCategoryId) {
            const generalCat = await prisma.customerCategory.findFirst({ where: { name: 'Genel' } });
            if (generalCat) targetCategoryId = generalCat.id;
        }

        const newCustomer = await prisma.customer.create({
            data: {
                name,
                phone,
                email,
                address,
                taxNumber,
                taxOffice,
                contactPerson,
                iban,
                branch: branch || 'Merkez',
                categoryId: targetCategoryId
            }
        });

        return NextResponse.json({ success: true, customer: newCustomer });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
