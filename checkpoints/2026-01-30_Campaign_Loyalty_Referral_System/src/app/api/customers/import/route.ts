import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data } = body; // Array of customers

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ success: false, error: 'Geçersiz veri formatı.' }, { status: 400 });
        }

        let successCount = 0;
        const generalCat = await prisma.customerCategory.findFirst({ where: { name: 'Genel' } });
        const categoryId = generalCat ? generalCat.id : undefined;

        for (const item of data) {
            if (item.name) {
                // Check if exists? Maybe skip for bulk specific logic regarding duplicates
                // For now, simple create
                try {
                    await prisma.customer.create({
                        data: {
                            name: item.name,
                            phone: item.phone ? String(item.phone) : undefined,
                            email: item.email,
                            taxNumber: item.taxNumber ? String(item.taxNumber) : undefined,
                            taxOffice: item.taxOffice,
                            address: item.address,
                            contactPerson: item.contactPerson,
                            iban: item.iban,
                            categoryId: categoryId
                        }
                    });
                    successCount++;
                } catch (err) {
                    console.error("Skipped duplicate or error:", item.name, err);
                }
            }
        }

        return NextResponse.json({ success: true, count: successCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
