
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Frontend formatı
        const formattedSuppliers = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category || 'Genel',
            phone: s.phone || '',
            balance: Number(s.balance || 0),
            branch: s.branch || 'Merkez',
            status: s.isActive ? 'Aktif' : 'Pasif'
        }));

        return NextResponse.json({ success: true, suppliers: formattedSuppliers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, address, taxNumber, taxOffice, category, contactPerson, iban, branch } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Tedarikçi adı zorunludur.' }, { status: 400 });
        }

        const newSupplier = await prisma.supplier.create({
            data: {
                name,
                phone,
                email,
                address,
                taxNumber,
                taxOffice,
                contactPerson,
                iban,
                category,
                branch: branch || 'Merkez'
            }
        });

        return NextResponse.json({ success: true, supplier: newSupplier });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
