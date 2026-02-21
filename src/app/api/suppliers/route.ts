
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const suppliers = await prisma.supplier.findMany({
            where: { companyId, deletedAt: null },
            orderBy: { updatedAt: 'desc' }
        });

        const formattedSuppliers = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category || 'Genel',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            city: s.city || '',
            district: s.district || '',
            taxNumber: s.taxNumber || '',
            taxOffice: s.taxOffice || '',
            contactPerson: s.contactPerson || '',
            iban: s.iban || '',
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
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const body = await request.json();
        const { name, phone, email: rawEmail, address, city, district, taxNumber, taxOffice, category, contactPerson, iban, branch } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Tedarikçi adı zorunludur.' }, { status: 400 });
        }

        // Boş email → null (unique constraint koruması)
        const email = (rawEmail && rawEmail.trim() !== '') ? rawEmail.trim() : null;

        const companyId = await resolveCompanyId(user);
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 400 });
        }

        const newSupplier = await prisma.supplier.create({
            data: {
                name,
                phone,
                email,
                address,
                city,
                district,
                taxNumber,
                taxOffice,
                contactPerson,
                iban,
                category,
                branch: branch || 'Merkez',
                companyId
            }
        });

        return NextResponse.json({ success: true, supplier: newSupplier });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { id, name, phone, email: rawEmail, address, city, district, taxNumber, taxOffice, category, contactPerson, iban, branch, isActive } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID zorunludur.' }, { status: 400 });
        }

        const email = (rawEmail && rawEmail.trim() !== '') ? rawEmail.trim() : null;

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                address,
                city,
                district,
                taxNumber,
                taxOffice,
                contactPerson,
                iban,
                category,
                branch,
                isActive
            }
        });

        return NextResponse.json({ success: true, supplier: updatedSupplier });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID zorunludur.' }, { status: 400 });
        }

        await prisma.supplier.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
