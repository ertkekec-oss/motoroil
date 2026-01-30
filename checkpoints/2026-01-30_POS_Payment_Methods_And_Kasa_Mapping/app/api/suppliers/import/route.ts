import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ success: false, error: 'Geçersiz veri formatı.' }, { status: 400 });
        }

        let successCount = 0;

        for (const item of data) {
            if (item.name) {
                try {
                    await prisma.supplier.create({
                        data: {
                            name: item.name,
                            category: item.category,
                            phone: item.phone ? String(item.phone) : undefined,
                            email: item.email,
                            taxNumber: item.taxNumber ? String(item.taxNumber) : undefined,
                            taxOffice: item.taxOffice,
                            address: item.address,
                            contactPerson: item.contactPerson,
                            iban: item.iban
                        }
                    });
                    successCount++;
                } catch (err) {
                    console.error("Skipped supplier:", item.name, err);
                }
            }
        }

        return NextResponse.json({ success: true, count: successCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
